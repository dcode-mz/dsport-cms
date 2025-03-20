export interface ResponseBody<T> {
    msg: string;
    payload: T;
    successful: boolean
}