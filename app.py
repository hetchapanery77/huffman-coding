from flask import Flask, request, send_file, render_template, jsonify
import os
from huffman import HuffmanCoding
import shutil

app = Flask(__name__, static_folder='.', static_url_path='', template_folder='.')

UPLOAD_FOLDER = 'uploads'
COMPRESSED_FOLDER = 'compressed'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(COMPRESSED_FOLDER):
    os.makedirs(COMPRESSED_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compress', methods=['POST'])
def compress_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(input_path)

        # Initialize Huffman Coding with the input path
        h = HuffmanCoding(input_path)
        
        # Compress the file
        output_path = h.compress()
        
        # The HuffmanCoding.compress method saves the file next to the input file with .bin extension
        # We want to move it to our COMPRESSED_FOLDER
        compressed_filename = os.path.basename(output_path)
        final_output_path = os.path.join(COMPRESSED_FOLDER, compressed_filename)
        
        if os.path.exists(final_output_path):
            os.remove(final_output_path)
        shutil.move(output_path, final_output_path)

        return jsonify({
            "message": "File compressed successfully",
            "filename": compressed_filename,
            "download_url": f"/download/{compressed_filename}"
        })

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(COMPRESSED_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/decompress', methods=['POST'])
def decompress_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(input_path)

        # Initialize Huffman Coding with the input path
        h = HuffmanCoding(input_path)
        
        try:
            # Decompress the file
            # Note: decompress() expects the bin path and returns the txt path
            output_path = h.decompress(input_path)
        except Exception as e:
            return jsonify({
                "error": "Decompression failed. The file format might be incompatible. Please try compressing a NEW file first.",
                "details": str(e)
            }), 400
        
        decompressed_filename = os.path.basename(output_path)
        final_output_path = os.path.join(COMPRESSED_FOLDER, decompressed_filename)
        
        if os.path.exists(final_output_path):
            os.remove(final_output_path)
        shutil.move(output_path, final_output_path)

        return jsonify({
            "message": "File decompressed successfully",
            "filename": decompressed_filename,
            "download_url": f"/download/{decompressed_filename}"
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
