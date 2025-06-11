# RenovaAI Production Deployment Guide

This guide walks you through deploying RenovaAI to a production environment on Azure Linux with public accessibility.

## 🏗️ Architecture Overview

The production setup includes:
- **Nginx**: Reverse proxy and static file server
- **Backend**: Flask API with Gunicorn WSGI server
- **Frontend**: React SPA served as static files
- **Docker**: Containerized deployment with Docker Compose

## 📋 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- 4GB+ RAM (8GB recommended)
- 20GB+ storage
- Docker and Docker Compose installed
- Domain name pointing to your server

### API Keys Required
- OpenAI API Key (for chat and prompt enhancement)
- Replicate API Token (for AI image generation)

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
git clone <your-repo>
cd designer_appaiv2

# Make deployment script executable
chmod +x deploy-azure.sh

# Run full deployment
./deploy-azure.sh full
```

### 2. Configure Environment
Edit `.env` file with your actual values:
```bash
nano .env
```

Required changes:
```env
# Replace with your actual API keys
OPENAI_API_KEY=sk-your-actual-openai-key
REPLICATE_API_TOKEN=r8_your-actual-replicate-token

# Replace with your actual domain
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
```

### 3. Update Domain Configuration
Edit `nginx/default.conf`:
```bash
nano nginx/default.conf
```

Replace `your-domain.com` with your actual domain.

### 4. Deploy
```bash
./deploy-azure.sh deploy
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### 1. Environment Setup
```bash
# Copy production environment template
cp env.production .env

# Edit with your values
nano .env
```

### 2. Build and Deploy
```bash
# Build the application
docker-compose -f docker-compose.prod.yml build

# Start the application
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Test health endpoint
curl http://localhost/health
```

## 🔐 SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

1. **Install Certbot**:
```bash
sudo apt update
sudo apt install certbot
```

2. **Stop Nginx temporarily**:
```bash
docker-compose -f docker-compose.prod.yml stop nginx
```

3. **Obtain Certificate**:
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

4. **Copy Certificates**:
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
sudo chown $(whoami):$(whoami) ./ssl/*
```

5. **Enable HTTPS in Nginx**:
Edit `nginx/default.conf` and uncomment SSL configuration lines.

6. **Restart Application**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Certificate Renewal
Set up automatic renewal:
```bash
# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/your/app/docker-compose.prod.yml restart nginx" | sudo crontab -
```

## 🔥 Azure-Specific Configuration

### Azure Container Instances
If deploying to Azure Container Instances:

1. **Create Resource Group**:
```bash
az group create --name renovaai-rg --location eastus
```

2. **Deploy Container Group**:
```bash
az container create \
  --resource-group renovaai-rg \
  --file docker-compose.prod.yml \
  --name renovaai-app
```

### Azure App Service
For Azure App Service deployment:

1. Create App Service with Docker support
2. Set environment variables in Azure Portal
3. Configure custom domain and SSL

## 🔍 Monitoring and Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs nginx

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Checks
- **Nginx**: `http://yourdomain.com/health`
- **Backend API**: `http://yourdomain.com/api/health`
- **Application**: `http://yourdomain.com`

## 🛡️ Security Considerations

### Firewall Setup
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if needed)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### Environment Security
- Never commit `.env` files to version control
- Use strong, unique secrets
- Regularly rotate API keys
- Keep Docker images updated

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and redeploy
./deploy-azure.sh deploy
```

### Backup Data
```bash
# Backup uploads
docker cp $(docker-compose -f docker-compose.prod.yml ps -q backend):/app/uploads ./backups/uploads-$(date +%Y%m%d)

# Backup environment
cp .env ./backups/env-$(date +%Y%m%d)
```

## 🐛 Troubleshooting

### Common Issues

1. **Container Won't Start**:
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

2. **502 Bad Gateway**:
- Backend container not running
- Backend not responding on port 5000
- Check backend logs

3. **SSL Certificate Issues**:
```bash
# Test certificate
openssl s_client -connect yourdomain.com:443

# Check certificate files
ls -la ssl/
```

4. **API Errors**:
- Check API keys in `.env`
- Verify CORS settings
- Check backend logs

### Debug Commands
```bash
# Enter backend container
docker-compose -f docker-compose.prod.yml exec backend bash

# Test backend directly
curl http://localhost:5000/api/health

# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

## 📞 Support

For issues or questions:
1. Check logs first
2. Review this guide
3. Check GitHub issues
4. Contact support

## 🚀 Performance Tips

1. **Use SSD storage** for better I/O performance
2. **Scale horizontally** by adding more backend workers
3. **Use CDN** for static assets
4. **Monitor resource usage** and scale accordingly
5. **Enable gzip compression** (already configured in nginx)

---

**Next Steps**: After deployment, consider setting up monitoring, backup automation, and CI/CD pipelines for easier maintenance. 