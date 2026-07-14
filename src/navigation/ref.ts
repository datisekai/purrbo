import { createNavigationContainerRef } from '@react-navigation/native';

// Ref điều hướng dùng ngoài component (vd: khi chạm thông báo).
export const navigationRef = createNavigationContainerRef<any>();

// Điều hướng an toàn: chỉ chạy khi cây điều hướng đã sẵn sàng.
export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    // @ts-ignore — name động
    navigationRef.navigate(name, params);
  }
}
