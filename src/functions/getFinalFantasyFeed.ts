import Parser from "rss-parser"
import { Logger } from "#/logger/Logger"

type FinalFantasyFeed = {
    id: string
    title: string
    link: string
    author: string
    date: Date
    image: string
    message: string
}

export enum FeedType {
    NEWS,
    TOPIC
}

const parser = new Parser({
    requestOptions: {
        rejectUnauthorized: false
    }
})

export default async function getFinalFantasyFeed(url: string, type: FeedType, itemIndex: number = 0): Promise<FinalFantasyFeed | Error> {
    const feed = await parser.parseURL(url).catch(err => Logger.error(err))
    if (!feed) return new Error("Unable to read RSS feed")

    const item = feed.items[itemIndex]
    const id = feed.id
    const title = item.title
    const link = item.link
    const author = item.author
    const dataString = item.isoDate
    if (!dataString) return new Error("Date not found")
    const date = new Date(dataString)

    let image = ""
    switch (type) {
        case FeedType.NEWS:
            image = "https://lodestonenews.com/images/logo.png"
            break
        case FeedType.TOPIC:
            image =
                "https://cdn.discordapp.com/attachments/941726047991369800/1190241684211122196/ff14_star.png?ex=65a115f3&is=658ea0f3&hm=8fcb9e539cc25e9e34c57e3c464b4de6c0d8abce5a8aa4dcbf48857b385d3ccd&"
            break
    }

    const message = item.contentSnippet?.replace("<br>\n", "\n").slice(0, 2000) || ""

    if (!title) return new Error("No Title Found")
    if (!link) return new Error("No Link Found")

    return {
        id,
        title,
        link,
        author,
        date,
        image,
        message
    } satisfies FinalFantasyFeed
}
