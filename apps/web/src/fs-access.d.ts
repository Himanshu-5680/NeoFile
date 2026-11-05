interface FileSystemPermissionDescriptor {
  mode?: "read" | "readwrite";
}

interface FileSystemFileHandle {
  queryPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface Window {
  showOpenFilePicker(options?: { multiple?: boolean }): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: { suggestedName?: string }): Promise<FileSystemFileHandle>;
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}
