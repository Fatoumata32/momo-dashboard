from flask import Flask, render_template, jsonify
from data_processor import MoMoDataProcessor
import os

app = Flask(__name__, 
            static_folder='../frontend/static',
            template_folder='../frontend/templates')

processor = MoMoDataProcessor()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/summary')
def get_summary():
    try:
        summary = processor.get_transaction_summary()
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions')
def get_transactions():
    try:
        # Load the XML file directly from the static directory
        xml_file_path = os.path.join(app.static_folder, 'xml', 'data.xml')
        
        if not os.path.exists(xml_file_path):
            return jsonify({'error': 'XML file not found'}), 404
        
        # Process the XML file
        processed_data = processor.process_xml_file(xml_file_path)
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        type_filter = request.args.get('type', '')
        
        offset = (page - 1) * limit
        
        # Filter data based on search and type filter
        filtered_data = [entry for entry in processed_data if (
            (search.lower() in entry['details'].lower() or search.lower() in entry['phone_number'].lower()) and
            (type_filter == '' or entry['type'] == type_filter)
        )]
        
        # Paginate the filtered data
        total_count = len(filtered_data)
        paginated_data = filtered_data[offset:offset + limit]
        
        return jsonify({
            'transactions': paginated_data,
            'total': total_count,
            'page': page,
            'pages': (total_count + limit - 1) // limit
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
