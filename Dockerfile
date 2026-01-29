# Use the official Nginx image as the base
FROM nginx:alpine

# Copy your marketing site files (HTML, CSS, JS) to the Nginx web root
# Ensure your marketing files are in the root or a 'public' folder
COPY . /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Configure Nginx to listen on port 8080
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
