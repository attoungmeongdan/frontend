// 서버 공통 응답
export interface CommonResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}
