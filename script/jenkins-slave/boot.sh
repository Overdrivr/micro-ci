#!/bin/sh

#Jenkins slave will tell jenkins master that it is available


#curl -d "offlineMessage=&json=%7B%22offlineMessage%22%3A+%22%22%7D&Submit=Yes" http://localhost:8080/computer/Slave/doDisconnect

 
curl   --user slave:672c50b97983dbc0a22db83b7e2d68de -d "offlineMessage=&json=%7B%22offlineMessage%22%3A+%22%22%7D&Submit=Yes" http://localhost:8080/computer/Slave/doDisconnect
