# Set CWD to script location
cd "${0%/*}"

# Prep
mkdir data
cp homeserver.yaml data/homeserver.yaml
cp localhost.log.config data/localhost.log.config
chmod -R 777 data

# Start server
(docker start synapse)
if [ $? -ne 0 ]; then
    docker run -d --name synapse \
        --volume ./data:/data \
        -p 8008:8008 \
        matrixdotorg/synapse:latest
fi

# Take a nap :3
sleep 5

# Create admin and test user
docker exec -it synapse \
    register_new_matrix_user http://localhost:8008 \
    -c /data/homeserver.yaml \
    --user test \
    --password test \
    --no-admin \
    --exists-ok

docker exec -it synapse \
    register_new_matrix_user http://localhost:8008 \
    -c /data/homeserver.yaml \
    --user admin \
    --password admin \
    --admin \
    --exists-ok

# Wait for the end of time...
printf "%s " "Press Return to shut down server"
read ans

# Die :c
docker stop synapse

echo "Delete 'data' and run 'docker rm synapse' to remove data"
