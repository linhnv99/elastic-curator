### Elastic curator

`` Thực hiện xóa index (elasticsearch) sau X ngày
``

#### Các bước thực hiện

- B1. Set env
    ```
    HOST=http://localhost:9200
    USER_NAME= 
    PASSWORD=
    CURATOR_DAY= Xóa sau X ngày
    CRON=0 0 2 * * *
    WEB_HOOK=slack notify 
   ```
- B2. Run tool
    ```
    sudo npm install forever -y
  
    forever start ./index.js
            
    forever stop ./index.js
    ```