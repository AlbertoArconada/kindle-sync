declare module 'tar-js' {
    export class Reader {
        read(data: string): { [key: string]: Buffer };
    }
} 