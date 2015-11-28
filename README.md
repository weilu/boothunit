# boothunit
Instant photo printing service on events

## Components
There are three components in this app: 

__The browser app__ is the piece that user interacts with. It provides photo filters and uploads photos to the photo hosting server. Photo filter logici is entirly client side. It communicates with the photo hosting app through xhr.

__The photo hosting server__ is a server that lives somewhere on the internet. It hosts all the photos uploaded and talks to the printing client via web socket.

__The printing client__ is a simple printing client that runs on any device that can talk to a photo printer. It accepts messages through web socket and sends photos to the print queue.

## Development
```bash
# start the photo hosting server
SECRET=poormansauth npm start
# start the printing client
SECRET=poormansauth WS_HOST=localhost:8000 node client.js 
# check it out in your browser
open localhost:8000
```
