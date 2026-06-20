import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
response = requests.get(url)
xml_content = response.content

# Namespace dict for Atom feed
ns = {'atom': 'http://www.w3.org/2005/Atom'}
root = ET.fromstring(xml_content)

entries = []
for entry in root.findall('atom:entry', ns):
    title = entry.find('atom:title', ns).text
    updated = entry.find('atom:updated', ns).text
    link_elem = entry.find("atom:link[@rel='alternate']", ns)
    link = link_elem.attrib['href'] if link_elem is not None else ""
    content_elem = entry.find('atom:content', ns)
    
    updates = []
    if content_elem is not None and content_elem.text:
        soup = BeautifulSoup(content_elem.text, 'html.parser')
        
        # We need to find h3 elements and pair them with their subsequent siblings until the next h3
        current_type = None
        current_siblings = []
        
        for child in soup.children:
            if child.name == 'h3':
                # Save previous update if any
                if current_type and current_siblings:
                    html_content = "".join(str(s) for s in current_siblings)
                    text_content = BeautifulSoup(html_content, 'html.parser').get_text(separator=' ').strip()
                    updates.append({
                        'type': current_type,
                        'html': html_content,
                        'text': text_content
                    })
                current_type = child.get_text().strip()
                current_siblings = []
            elif child.name is not None:
                # If we haven't seen an h3 yet, default to 'Update'
                if current_type is None:
                    current_type = 'Update'
                current_siblings.append(child)
        
        # Save the last update
        if current_type and current_siblings:
            html_content = "".join(str(s) for s in current_siblings)
            text_content = BeautifulSoup(html_content, 'html.parser').get_text(separator=' ').strip()
            updates.append({
                'type': current_type,
                'html': html_content,
                'text': text_content
            })
            
    entries.append({
        'date': title,
        'updated': updated,
        'link': link,
        'updates': updates
    })

print(f"Parsed {len(entries)} entries successfully.")
if entries:
    print("\nFirst entry details:")
    print(f"Date: {entries[0]['date']}")
    print(f"Link: {entries[0]['link']}")
    print("Updates:")
    for u in entries[0]['updates']:
        print(f"  [{u['type']}]: {u['text'][:100]}...")
