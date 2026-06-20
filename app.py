import os
import re
import datetime
import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Feed URL
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache
feed_cache = {
    "data": None,
    "last_fetched": None
}

def parse_release_notes():
    """Fetches and parses the BigQuery release notes XML feed."""
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_content = response.content
    except Exception as e:
        print(f"Error fetching release notes: {e}")
        return None

    try:
        # Namespace for Atom
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(xml_content)

        entries = []
        entry_idx = 0
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns).text
            updated = entry.find('atom:updated', ns).text
            
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link = link_elem.attrib['href'] if link_elem is not None else ""
            
            content_elem = entry.find('atom:content', ns)
            
            updates = []
            if content_elem is not None and content_elem.text:
                soup = BeautifulSoup(content_elem.text, 'html.parser')
                
                # Group sibling elements by their preceding H3 header
                current_type = None
                current_siblings = []
                update_idx = 0
                
                for child in soup.children:
                    if child.name == 'h3':
                        # Save the previous update section before starting a new one
                        if current_type and current_siblings:
                            html_content = "".join(str(s) for s in current_siblings)
                            # Strip tags and normalize spacing
                            text_content = BeautifulSoup(html_content, 'html.parser').get_text(separator=' ')
                            text_content = re.sub(r'\s+', ' ', text_content).strip()
                            
                            updates.append({
                                'id': f"note-{entry_idx}-{update_idx}",
                                'type': current_type,
                                'html': html_content,
                                'text': text_content
                            })
                            update_idx += 1
                        
                        current_type = child.get_text().strip()
                        current_siblings = []
                    elif child.name is not None:
                        # Fallback to 'Update' if there's no header yet
                        if current_type is None:
                            current_type = 'Update'
                        current_siblings.append(child)
                
                # Save the last update section
                if current_type and current_siblings:
                    html_content = "".join(str(s) for s in current_siblings)
                    text_content = BeautifulSoup(html_content, 'html.parser').get_text(separator=' ')
                    text_content = re.sub(r'\s+', ' ', text_content).strip()
                    
                    updates.append({
                        'id': f"note-{entry_idx}-{update_idx}",
                        'type': current_type,
                        'html': html_content,
                        'text': text_content
                    })
            
            entries.append({
                'id': f"group-{entry_idx}",
                'date': title,
                'updated': updated,
                'link': link,
                'updates': updates
            })
            entry_idx += 1
            
        return entries
    except Exception as e:
        print(f"Error parsing release notes XML: {e}")
        return None

@app.route('/')
def index():
    """Serves the main frontend page."""
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    """API endpoint to get parsed release notes.
    Supports force-refresh via '?refresh=true' query parameter.
    """
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    # Check if cache is empty or if we are force-refreshing
    if feed_cache["data"] is None or force_refresh:
        data = parse_release_notes()
        if data is not None:
            feed_cache["data"] = data
            feed_cache["last_fetched"] = datetime.datetime.now().isoformat()
        elif feed_cache["data"] is None:
            return jsonify({"error": "Failed to fetch and parse release notes"}), 500
            
    return jsonify({
        "last_fetched": feed_cache["last_fetched"],
        "notes": feed_cache["data"]
    })

if __name__ == '__main__':
    # Run the Flask app locally on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
