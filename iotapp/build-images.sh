# launch registry service if not done already
if [ ! "$(docker ps -q -f name=registry" ]; then
	docker run -d -p 5000:5000 --restart=always --name registry registry:2
fi

docker build -t iotapp-node-image .

docker tag iotapp-node-image:latest 10.0.0.89:5000/iotapp-node-image:latest

docker push 10.0.0.89:5000/iotapp-node-image:latest

