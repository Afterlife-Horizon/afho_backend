type apiUser = {
    id: string;
    username: string;
    accent_color: string;
    avatar: string;
    avatar_decoration: string;
    banner: string;
    banner_color: string;
    discriminator: string;
    flags: number;
    locale: string;
    mfa_enabled: boolean;
    premium_type: number;
    public_flags: number;
}

interface user extends apiUser {
    isAdmin: boolean;
}

type discordUser = {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    displayAvatarURL: string;
    bot: boolean;
    system: boolean;
    flags: number;
    createdTimestamp: number;
    defaultAvatarURL: string;
    tag: string;
}

type song = {
    name: string;
    artist: string;
    requester: string;
    filters: {
        bassboost: number;
        subboost: boolean;
        mcompand: boolean;
        haas: boolean;
        gate: boolean;
        karaoke: boolean;
        flanger: boolean;
        pulsator: boolean;
        surrounding: boolean,
        "3d": boolean,
        vaporwave: boolean,
        nightcore: boolean,
        phaser: boolean,
        normalizer: boolean,
        speed: number,
        tremolo: boolean,
        vibrato: boolean,
        reverse: boolean,
        treble: boolean;
    };
    url: string;
    formatedprog: string;
    duration: string;
    cover_src: string;
}

type effects = {
    bassboost: number;
    subboost: boolean;
    mcompand: boolean;
    haas: boolean;
    gate: boolean;
    karaoke: boolean;
    flanger: boolean;
    pulsator: boolean;
    surrounding: boolean,
    "3d": boolean,
    vaporwave: boolean,
    nightcore: boolean,
    phaser: boolean,
    normalizer: boolean,
    speed: number,
    tremolo: boolean,
    vibrato: boolean,
    reverse: boolean,
    treble: boolean;
}

type channel = {
    iconURL: string;
    id: string;
    name: string;
    type: string;
    url: string;
    subsribers: any;
    verified: boolean;
}

type thumbnail = {
    id: string;
    width: number;
    height: number;
    url: string;
}

type track = {
    channel: channel;
    description: any;
    duration: number;
    durationFormatted: string;
    id: string;
    likes: number;
    live: boolean;
    nsfw: string;
    private: boolean;
    requester: discordUser;
    thumbnail: thumbnail;
    title: string;
    shorts: boolean;
    tags: string[];
    unlisted: boolean;
    uploadedAt: string;
    views: number;
}

type queueItem = {
	[x: number]: number;
    bitrate: number;
    creator: discordUser;
    effects: effects;
    filtersChanged: boolean;
    paused: boolean;
    queueloop: boolean;
    skipped: boolean;
    textChannel: string;
    trackloop: boolean;
    tracks: track[];
    volume: number;
};

type fav = {
    name: string;
    url: string;
    thumbnail: string;
}

type admin = {
    [0]: discordUser
    [1]: {
        avatar: any;
        avatarURL: any;
        comunicationDisabledUntilTimestamp: any;
        displayAvatarURL: string;
        displayName: String;
        guildId: string;
        joinedTimestamp: any;
        nickname: string;
        pending: boolean;
        premiumSinceTimestamp: number;
        roles: string[];
        uderId: string;
    }
}
interface IFetchData {
    admins: {
        admins: admin[];
        usernames: string[];
    };
    formatedprog: string;
    prog: number;
    queue: queueItem[];
}