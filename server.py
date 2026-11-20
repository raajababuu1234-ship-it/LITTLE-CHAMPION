"""
Little Champions Web & Mobile Local Server.
Serves the web application and displays QR code / IP for phones on local Wi-Fi.
"""

import os
import sys
import json
import socket
import webbrowser
import http.server
import socketserver
from pathlib import Path

# Force UTF-8 stdout on Windows to prevent UnicodeEncodeError in cp1252
if sys.platform == "win32":
    try:
        if sys.stdout.encoding.lower() != 'utf-8':
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Get local directory
BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"

PORT = 8000


class LittleChampionsHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with API support for saving & loading dynamic content."""

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/get_content'):
            custom_file = WEB_DIR / "custom_content.json"
            if custom_file.exists():
                try:
                    content = custom_file.read_bytes()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except Exception:
                    pass
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            payload = b'{"poems": [], "courses": [], "voiceSettings": {}}'
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/save_content'):
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length)
                parsed = json.loads(body.decode('utf-8'))
                custom_file = WEB_DIR / "custom_content.json"
                with open(custom_file, 'w', encoding='utf-8') as f:
                    json.dump(parsed, f, indent=2, ensure_ascii=False)

                resp = json.dumps({"status": "ok", "message": "Content saved successfully!"}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
                return
            except Exception as e:
                resp = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
                return
        self.send_response(404)
        self.end_headers()


def get_local_ip():
    """Detect local Wi-Fi / LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def generate_qr(url):
    """Generate QR code image and terminal display."""
    qr_img_path = WEB_DIR / "phone_qr.png"
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Save image for web modal
        img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")
        img.save(str(qr_img_path))

        # Generate ASCII text for terminal using standard '#' and ' '
        matrix = qr.get_matrix()
        ascii_lines = []
        for row in matrix:
            line = "".join("  " if cell else "##" for cell in row)
            ascii_lines.append(line)
        return "\n".join(ascii_lines)
    except Exception as e:
        print(f"[Note] QR generation note: {e}")
        return None


def run_server():
    ip = get_local_ip()
    phone_url = f"http://{ip}:{PORT}"
    local_url = f"http://localhost:{PORT}"

    # Generate QR code
    ascii_qr = generate_qr(phone_url)

    # Change working directory to web
    os.chdir(str(WEB_DIR))

    print("\n" + "=" * 68)
    print(" [*] LITTLE CHAMPIONS: PLAY & LEARN")
    print("=" * 68)
    print("\n [!] HOW TO PLAY ON YOUR PHONE:")
    print(" 1. Make sure your phone is connected to the same Wi-Fi network.")
    print(" 2. Open Camera or Chrome/Safari on your phone and open:")
    print(f"\n      >>>  {phone_url}  <<<\n")

    if ascii_qr:
        print(" Or scan this QR code with your phone camera:")
        print("-" * 68)
        print(ascii_qr)
        print("-" * 68)

    print(f"\n [*] ON THIS COMPUTER: Opening {local_url} in your browser...")
    print("=" * 68)
    print(" [Press Ctrl+C to stop the server]\n")

    try:
        webbrowser.open(local_url)
    except Exception:
        pass

    handler = LittleChampionsHandler
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped. Have a wonderful day!")


if __name__ == "__main__":
    run_server()
