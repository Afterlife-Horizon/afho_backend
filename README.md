# Afterlife Horizon Server Bot

This bot is created and designed by myself using ExpressJS and DiscordJS.

## functionalities

-   Fun commands for server members
-   Commands to manage server and bot
-   A whole lot of music commands for the use in a channel up to 128kbits.
-   [A website to help manage more easily everything](https://github.com/nicobonnardot3/afho_frontend)

## Requirements

-   NodeJS 18.15.0 or higher
-   MariaDB 10.5.18 or higher
-   ffmpeg 4.3.5 or higher

## Installation

1.  Create a mariaDB database using the tables:

    ```bash
    npx prisma migrate dev --name init
    ```

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

    ```bash
    nano ./.env
    ```

        **`.env`**

    ```bash
    DATABASE_URL="mysql://user:password@127.0.0.1:3306/myDb" # Database url, encode user, password and myDb with Percent-encoding and replace them in the string

    # Discord related variables
    SERVER_ID=""                  # name of your server
    CLIENT_ID=""                    # discord client id
    TOKEN=""                        # discord bot token

    ## channels
    BASE_CHANNEL_ID=""              # id of bot message channel
    BRASIL_CHANNEL_ID=""            # id of bresil channel
    REACTION_ROLE_CHANNEL_ID=""     # id of reaction role channel / optional
    CHAT_GPT_CHANNEL_ID=""			# id of the chat gpt channel / optional
    FF14_NEWS_CHANNEL_ID=""         # id for ff14 news / optional

    ## roles
    ADMIN_ROLE_ID=""                # id of admin role

    # website related variables
    WEBSITE_URL="http://127.0.0.1:8080"    # url of your website: ex: https://google.com
    SUPABASE_URL=""                 # url of your supabase project
    SUPABASE_KEY=""                 # public key from supabase

    # optionnal variables
    OPENAI_KEY=""                   # openAi key
    YOUTUBE_LOGIN_COOKIE=""         # youtube cookie
    SPOTIFY_CLIENT_ID=""			# login id for spotify
    SPOTIFY_CLIENT_SECRET=""		# spotify secret


    # add these certificate files if you want to use https
    CERT=""             # certificate file
    CERT_KEY=""     # private key

    LOG_LEVEL=info                  # debug/info/warn/error
    VOICEFUNNY=1                    # 1 to turn on
    ```

    _You can change the app port by adding `PORT=...` variables in the .env_

8.  Install the dependencies:

    ```bash
    npm install
    ```

9.  Start the bot in `/path/to/project/root/`:

    ```bash
    npm start
    ```

10. Setup pm2 for prod:

    ```bash
    pm2 start dist/index.js --name backend
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

_There are more than 30 commands to look at, I advise typing /help for more information..._

## Websites

-   [Music Bot Website](https://music.afterlifehorizon.net)
