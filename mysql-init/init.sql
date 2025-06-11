-- Grant privileges to root user from any host
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'secret' WITH GRANT OPTION;
FLUSH PRIVILEGES; 