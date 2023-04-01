# Afterlife Horizon Bot Project

_Discord bot designed and only used for Afterlife Horizon discord server!_

This bot is created and designed by myself.

## functionalities

-   Useful commands for server management (not yet implemented)
-   A whole lot of music commands for the use in a channel up to 128kbits.
-   A website to help manage more easily everything

## Requirements

-   NodeJS 18.15.0 or higher
-   MariaDB 10.5.18 or higher
-   ffmpeg 4.3.5 or higher

## Installation

1.  Create a mariaDB database using the tables:

    1. Bresil table:

        ```sql
        DROP TABLE IF EXISTS`bot_bresil`;
        /*!40101 SET @saved_cs_client     = @@character_set_client */;
        /*!40101 SET character_set_client = utf8 */;
        CREATE TABLE `bot_bresil`(
        `id`varchar(255) NOT NULL,
        `username`varchar(255) NOT NULL,
        `bresil_received`int(11) NOT NULL DEFAULT 0,
        `bresil_sent` int(11) NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        /_!40101 SET character_set_client = @saved_cs_client _/;
        ```

    2. Favorites table:

        ```sql
        DROP TABLE IF EXISTS`bot_favorites`;
        /*!40101 SET @saved_cs_client     = @@character_set_client */;
        /*!40101 SET character_set_client = utf8 */;
        CREATE TABLE `bot_favorites`(
        `id`int(11) NOT NULL AUTO_INCREMENT,
        `user_id`text NOT NULL,
        `name`varchar(255) NOT NULL,
        `url`varchar(255) NOT NULL,
        `thumbnail` varchar(255) NOT NULL,
        PRIMARY KEY (`id`)
        ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4;
        /_!40101 SET character_set_client = @saved_cs_client _/;
        ```

    3. Levels table

        ```sql
        DROP TABLE IF EXISTS `bot_levels`;
        /_!40101 SET @saved_cs_client = @@character_set_client _/;
        /_!40101 SET character_set_client = utf8 _/;
        CREATE TABLE `bot_levels` (
        `id` varchar(255) NOT NULL,
        `username` varchar(255) NOT NULL,
        `xp` int(11) NOT NULL,
        PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        /_!40101 SET character_set_client = @saved_cs_client _/;
        ```

    4. Add the necessary environment variables

2.  Add certificate files for the website in:

    -   **`~/.ssh/<YOUR_CERT_NAME>.crt`**
    -   **`~/.ssh/<YOUR_CERT_KEY_NAME>.key`**

    or where ever you want and change the path in the .env file

3.  Create an application:
    1.  https://discord.com/developers/applications
    2.  Create a Bot and copy the token for later
    3.  give the bot the necessary permissions presence intent, server members intent and server messages intent
4.  If you want acces to openAi features create an openAi account and get a token for the api
5.  Optionally get your youtube account token for the music bot (paste your cookie)
6.  Create an application on supabase:
    1.  https://supabase.com/
    2.  in Authentication tab go to URL Configurator and add the url of your website
    3.  In providers tab enable disord with the client id and secret of your discord application, copy the url
    4.  go to https://discord.com/developers/applications and add the url to the redirect uri
7.  Add all the variables in .env files:

    1. backend .env

        ```bash
        nano ./.env
        ```

        #### **`./.env`**

        ```bash
        # Database variables
        DB_ADRESS="127.0.0.1"       # adress of your database
        DB_DATABASE=""              # name of your database
        DB_USER="root"              # user of your database
        DB_PASSWORD=""              # password of your database

        # Discord related variables
        SERVER_NAME=""              # name of your server
        CLIENT_ID=""                # discord client id
        TOKEN=""                    # discord bot token
        BASE_CHANNEL_ID=""          # id of bot message channel
        BRASIL_CHANNEL_ID=""        # id of bresil channel
        ADMIN_ROLE_ID=""            # id of admin role
        SUPABASE_URL=""             # url of your supabase project
        SUPABASE_KEY=""             # public key from supabase

        # optionnal variables
        # OPENAI_KEY=               # openAi key
        # YOUTUBE_LOGIN_COOKIE=     # youtube cookie

        # add these certificate files if you want to use https
        # CERT="/home/<USER>/.ssh/<YOUR_CERT_NAME>.crt"     # certificate file
        # CERT_KEY="/home/<USER>/.ssh/<YOUR_CERT_KEY_NAME>.key"     # private key
        ```

    2. frontend .env

        ```bash
        nano ./frontend/.env
        ```

        #### **`./frontend/.env`**

        ```bash
        VITE_REDIRECT_URI=""    # url of your website with / at the end
        VITE_SUPABASE_URL=""    # url of your supabase project
        VITE_SUPABASE_KEY=""    # public key from supabase
        ```

8.  Install the dependencies:

    ```bash
    cd /path/to/project/root/frontend && npm install
    cd /path/to/project/root/ && npm install
    ```

9.  Build the frontend:

    ```bash
    cd /path/to/project/root/frontend && npm run build
    ```

10. Start the bot in `/path/to/project/root/`:

    ```bash
    npm start
    ```

11. To create a service:

    ```bash
    sudo nano /lib/systemd/system/<SERVICENAME>.service
    ```

    **`/lib/systemd/system/<SERVICENAME>.service`**

    ```bash
    [Unit]
    Description=service description
    After=network.target

    [Service]
    EnvironmentFile=/path/to/project/root/.env
    Type=simple
    User=user
    WorkingDirectory=/path/to/project/root/
    ExecStartPre=/usr/bin/npx tsc
    ExecStart=/usr/bin/node /path/to/project/root/dist/index.js
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```

    _if you apply update to the website you will need to manually build it_

## Main commands

### informational commands

-   `/help`
    Get information about any commands available.

-   `/serverinfo`
    Get information about the current server such as name and number of members.

-   `/ping`
    Responds with the bots current ping.

### Music commands

-   `/join`
    Make the bot join your current voice channel ( necessary to play music... ).

-   `/play`
    Adds the music you chose to the queue and plays the queue.

-   `/clearqueue`
    Removes everything in queue.

-   `/stop`
    Removes everything in queue and stops the music.

-   `/pause`
    Pauses the music.

-   `/resume`
    Resumes the music.

-   `/filters`
    Allows you to add filters to the queued songs.

_There are 30 commands to look at, I advise typing /help for more information..._

## Websites

-   [Main Website (not bot related)](https://afterlifehorizon.net)

-   [Music bots Website](https://music.afterlifehorizon.net)
