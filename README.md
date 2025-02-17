MoMo Data Processor API
This project provides a RESTful API that processes MoMo data from an XML file and returns transaction summaries and transaction details with support for pagination, search, and filtering.

Features
Transaction Summary: Get a summary of the MoMo transactions.
Transaction Details: Retrieve paginated transaction data, with support for searching and filtering by transaction type.
XML Data Processing: The data is extracted from a statically stored XML file (data.xml) and processed using a custom processor.
Project Structure
app.py: Main Flask application that handles API routes.
data_processor.py: Contains the logic to process the XML data and perform any necessary calculations.
/static/xml/data.xml: The XML file containing the MoMo transaction data (this is the source of the data for processing).
/templates: Directory for HTML templates (in case you want to render a frontend view).
/static: Folder for static files like images, CSS, etc.
Requirements
To run this project, ensure you have the following installed:

Python 3.x
Flask
Any additional dependencies used by data_processor.py (e.g., xml.etree.ElementTree for XML processing).