# Deployment Guide

## 1. Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl wget git ufw
```

## 2. Install Docker Engine

```bash
# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

## 3. Clone Repository

```bash
# Clone with GitHub token
git clone https://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@github.com/ProDanish203/Neighbourly---Probattle-26.git
cd Neighbourly---Probattle-26/server
```

## 4. Install and Setup Nginx

```bash
# Install nginx
sudo apt install -y nginx

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 5. Configure Nginx for Domain

```bash
# Create nginx config for domain
sudo nano /etc/nginx/sites-available/api.web-veritas.com
```

Paste the following configuration (replace `api.web-veritas.com` with your domain):

```nginx
server {
    listen 80;
    server_name api.web-veritas.com www.api.web-veritas.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /adminer {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /redis-insight {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/api.web-veritas.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 7. Generate SSL Certificate with Certbot

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d api.web-veritas.com -d www.api.web-veritas.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## 8. Deploy Application

```bash
# Navigate to server directory
cd ~/Neighbourly---Probattle-26/server

# Create .env file with required variables
nano .env

# Start services with Docker Compose
docker compose up -d

# Check logs
docker compose logs -f
```

## 9. Update Nginx Config After SSL

After certbot runs, it will automatically update your nginx config. Verify the SSL configuration:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Notes

- Replace `api.web-veritas.com` with your actual domain
- Ensure DNS A record points to your VPS IP
- Update `.env` file with all required environment variables
- Access adminer at `https://api.web-veritas.com/adminer`
- Access redis-insight at `https://api.web-veritas.com/redis-insight`
