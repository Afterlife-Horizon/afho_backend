# Afterlife Horizon Bot Project

_Discord bot designed and only used for Afterlife Horizon discord server!_

This bot is created and designed by myself.

## functionalities

-   Useful commands for server management (not yet implemented)
-   A whole lot of music commands for the use in a channel up to 128kbits.
-   A website to help manage more easily everything

## Requirements

-   NodeJS 18.0.0 or higher
-   MariaDB 10.5.12 or higher

## Installation

1.  Create a mariaDB database using the tables:

    1. Bresil table:

        ````sql
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
        ````

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
    4.  In the application/ OAuth2 tab add a redirect uri
    5.  Go to URL Generator and select identify and save the link for later
4.  If you want acces to openAi features create an openAi account and get a token for the api
5.  Optionally get your youtube account token for the music bot (paste your cookie)
6.  Add all the variables in a .env file:

    #### **`.env`**

    ```
    # CERT_KEY="/home/<USER>/.ssh/<YOUR_CERT_KEY_NAME>.key"
    # CERT="/home/<USER>/.ssh/<YOUR_CERT_NAME>.crt"

    DB_ADRESS="127.0.0.1"
    DB_USER="root"
    DB_PASSWORD=""
    DB_DATABASE=""

    DISCORD_REDIRECT_URI=""
    TOKEN=""
    CLIENT_ID=""
    SERVER_NAME=""
    BRASIL_CHANNEL_ID=""
    BASE_CHANNEL_ID=""
    # OPENAI_KEY=
    # YOUTUBE_LOGIN_COOKIE=
    ```

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

```

```

```

```

```

```
