/**
 *
 * @param ms time in milliseconds
 * @returns string of the given time in minutes:seconds format
 */
export function formatDuration(ms: number) {
    let sec = Math.floor((ms / 1000) % 60)
    let min = Math.floor((ms / (1000 * 60)) % 60)
    const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24)
    if (sec >= 60) sec = 0
    if (min >= 60) min = 0
    if (hrs > 1) return `${TwoDigits(hrs)}:${TwoDigits(min)}:${TwoDigits(sec)}`
    return `${TwoDigits(min)}:${TwoDigits(sec)}`
}

/**
 *
 * @returns string of the current time in hours:minutes:seconds.milliseconds format
 */
export function getTime() {
    const date = new Date()
    return `${TwoDigits(date.getHours())}:${TwoDigits(date.getMinutes())}:${TwoDigits(date.getSeconds())}.${ThreeDigits(date.getMilliseconds())}`
}

/**
 *
 * @param ms time to delay
 * @returns a promise that resolves after the time
 */
export async function delay(ms: number) {
    return new Promise(r => setTimeout(() => r(2), ms))
}

/**
 *
 * @param number time
 * @returns the number formated with at least two digits as string
 */
export function TwoDigits(number: number) {
    return number < 10 ? `0${number}` : `${number}`
}

/**
 *
 * @param number number to format
 * @returns the number formated with at least three digits as string
 */
export function ThreeDigits(number: number) {
    return number < 100 ? `0${TwoDigits(number)}` : `${number}`
}
