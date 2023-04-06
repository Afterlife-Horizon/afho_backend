# Afterlife Horizon Bot Project

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
7.  Add roles that you want the user to be able to add to themselves in **src/constants.ts**:

    ```ts
    import { IReactionRole } from "./types"

    export const reactionRoles: IReactionRole[] = [
    	// emoji 1
    	{
    		description: "description", // description of the role
    		emojiName: "role name", // name of the emoji without :: (ex: :smile: -> smile)
    		roleID: "role id" // id of the role, can be found by right clicking on the role and clicking on copy id
    	},
    	// emoji 2
    	{
    		description: "description",
    		emojiName: "role name",
    		roleID: "role id"
    	}
    	// ...
    ]
    ```

8.  Add all the variables in .env files:

    1. backend .env

        ```bash
        nano ./.env
        ```

        #### **`./.env`**

        ```bash
        DATABASE_URL="mysql://user:password@127.0.0.1:3306/myDb" # Database url, encode user, password and myDb with Percent-encoding and replace them in the string

        # Discord related variables
        SERVER_NAME=""                  # name of your server
        CLIENT_ID=""                    # discord client id
        TOKEN=""                        # discord bot token
        BASE_CHANNEL_ID=""              # id of bot message channel
        ADMIN_ROLE_ID=""                # id of admin role
        REACTION_ROLE_CHANNEL_ID=""     # id of reaction role channel / optional
        BRASIL_CHANNEL_ID=""            # id of bresil channel

        # website related variables
        WEBSITE_URL="127.0.0.1:8080"    # url of your website: ex: https://google.com
        SUPABASE_URL=""                 # url of your supabase project
        SUPABASE_KEY=""                 # public key from supabase

        # optionnal variables
        # OPENAI_KEY=""                   # openAi key
        # CHAT_GPT_CHANNEL_ID=""          # id of chat gpt channel
        # YOUTUBE_LOGIN_COOKIE=""         # youtube cookie

        # add these certificate files if you want to use https
        # CERT="/home/<USER>/.ssh/<YOUR_CERT_NAME>.crt"             # certificate file
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

9.  Install the dependencies:

    ```bash
    cd /path/to/project/root/frontend && npm install
    cd /path/to/project/root/ && npm install
    ```

10. Build the frontend:

    ```bash
    cd /path/to/project/root/frontend && npm run build
    ```

11. Start the bot in `/path/to/project/root/`:

    ```bash
    npm start
    ```

12. To create a service:

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

_There are more than 30 commands to look at, I advise typing /help for more information..._

## Websites

-   [Main Website (not bot related)](https://afterlifehorizon.net)

-   [Music bots Website](https://music.afterlifehorizon.net)
