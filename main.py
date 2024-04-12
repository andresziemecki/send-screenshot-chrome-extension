from flask import Flask, request

app = Flask(__name__)

def get_code(image_file):
    return """
    from flask import Flask, request

    app = Flask(__name__)

    @app.route('/upload', methods=['POST'])
    def upload_image():
        if 'image' not in request.files:
            return 'No image provided', 400
        
        image_file = request.files['image']

        if image_file.filename == '':
            return 'No selected image', 400
        
        # Save the image to a desired location
        # You may want to perform additional checks on the file extension, size, etc.
        image_file.save('/path/to/save/image.jpg')
        
        return 'Image uploaded successfully', 200

    if __name__ == '__main__':
        app.run(debug=True, port=8080)"""

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return 'No image provided', 400
    
    image_file = request.files['image']
    
    if image_file.filename == '':
        return 'No selected image', 400
    c = get_code(image_file)

    return c, 200

if __name__ == '__main__':
    app.run(debug=True, port=8080)