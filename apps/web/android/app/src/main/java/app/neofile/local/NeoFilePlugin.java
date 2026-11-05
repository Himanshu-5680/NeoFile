package app.neofile.local;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NeoFile")
public class NeoFilePlugin extends Plugin {
    private static final long MAX_BYTES = 40L * 1024L * 1024L;

    @PluginMethod
    public void pendingShares(PluginCall call) {
        try {
            JSArray files = new JSArray();
            JSONArray manifest = readManifest();
            for (int i = 0; i < manifest.length(); i++) {
                JSONObject item = manifest.getJSONObject(i);
                JSObject row = new JSObject();
                row.put("id", item.getString("id"));
                row.put("name", item.getString("name"));
                row.put("size", item.getLong("size"));
                files.put(row);
            }
            JSObject result = new JSObject();
            result.put("files", files);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    @PluginMethod
    public void readShare(PluginCall call) {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.reject("Missing id");
                return;
            }
            File file = new File(inboxDir(), id + ".bin");
            JSONObject meta = findMeta(id);
            if (!file.exists() || meta == null) {
                call.reject("That shared file is no longer in the inbox");
                return;
            }
            JSObject result = new JSObject();
            result.put("name", meta.getString("name"));
            result.put("base64", Base64.encodeToString(readFile(file), Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    @PluginMethod
    public void dismissShare(PluginCall call) {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.reject("Missing id");
                return;
            }
            new File(inboxDir(), id + ".bin").delete();
            JSONArray next = new JSONArray();
            JSONArray manifest = readManifest();
            for (int i = 0; i < manifest.length(); i++) {
                JSONObject item = manifest.getJSONObject(i);
                if (!id.equals(item.optString("id"))) next.put(item);
            }
            writeManifest(next);
            call.resolve();
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    @PluginMethod
    public void pickFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, intent, "onPickFiles");
    }

    @ActivityCallback
    private void onPickFiles(PluginCall call, ActivityResult result) {
        try {
            JSArray files = new JSArray();
            if (result.getResultCode() == Activity.RESULT_OK) {
                for (Uri uri : urisFrom(result.getData())) {
                    JSObject row = new JSObject();
                    row.put("name", displayName(uri));
                    row.put("base64", Base64.encodeToString(readBytes(uri), Base64.NO_WRAP));
                    files.put(row);
                }
            }
            JSObject payload = new JSObject();
            payload.put("files", files);
            call.resolve(payload);
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    @PluginMethod
    public void pickFolder(PluginCall call) {
        startActivityForResult(call, new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), "onPickFolder");
    }

    @ActivityCallback
    private void onPickFolder(PluginCall call, ActivityResult result) {
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            call.resolve(new JSObject());
            return;
        }
        int flags = data.getFlags();
        int take = flags & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        getContext().getContentResolver().takePersistableUriPermission(uri, take);
        DocumentFile doc = DocumentFile.fromTreeUri(getContext(), uri);
        JSObject payload = new JSObject();
        payload.put("uri", uri.toString());
        payload.put("name", doc != null && doc.getName() != null ? doc.getName() : "Folder");
        call.resolve(payload);
    }

    @PluginMethod
    public void listDir(PluginCall call) {
        try {
            String uri = call.getString("uri");
            DocumentFile doc = uri == null ? null : document(uri);
            if (doc == null) {
                call.reject("That folder is not available");
                return;
            }
            JSArray entries = new JSArray();
            DocumentFile[] children = doc.listFiles();
            if (children != null) {
                for (DocumentFile child : children) {
                    JSObject row = new JSObject();
                    row.put("name", child.getName() == null ? "untitled" : child.getName());
                    row.put("uri", child.getUri().toString());
                    row.put("dir", child.isDirectory());
                    row.put("size", child.length());
                    entries.put(row);
                }
            }
            JSObject payload = new JSObject();
            payload.put("entries", entries);
            call.resolve(payload);
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    @PluginMethod
    public void readUri(PluginCall call) {
        try {
            String raw = call.getString("uri");
            if (raw == null) {
                call.reject("Missing uri");
                return;
            }
            Uri uri = Uri.parse(raw);
            JSObject payload = new JSObject();
            payload.put("name", displayName(uri));
            payload.put("base64", Base64.encodeToString(readBytes(uri), Base64.NO_WRAP));
            call.resolve(payload);
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        try {
            String name = safeName(call.getString("name", "neofile.bin"));
            String mime = call.getString("mime", "application/octet-stream");
            byte[] bytes = Base64.decode(call.getString("base64", ""), Base64.NO_WRAP);
            JSObject payload = new JSObject();
            payload.put("location", writeDownload(name, mime, bytes));
            call.resolve(payload);
        } catch (Exception error) {
            call.reject(error.getMessage());
        }
    }

    public void ingestIntent(Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        try {
            int saved = 0;
            if (Intent.ACTION_SEND.equals(intent.getAction())) {
                Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (uri != null) {
                    saveInbox(displayName(uri), readBytes(uri));
                    saved++;
                } else {
                    String text = intent.getStringExtra(Intent.EXTRA_TEXT);
                    if (text != null && !text.isEmpty()) {
                        saveInbox("shared.txt", text.getBytes(StandardCharsets.UTF_8));
                        saved++;
                    }
                }
            } else if (Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction())) {
                ArrayList<Uri> uris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                if (uris != null) {
                    for (Uri uri : uris) {
                        saveInbox(displayName(uri), readBytes(uri));
                        saved++;
                    }
                }
            }
            if (saved > 0) {
                intent.setAction(null);
                notifyListeners("shareReceived", new JSObject());
            }
        } catch (Exception ignored) {
            // The system share stays available if the copy fails.
        }
    }

    private void saveInbox(String name, byte[] bytes) throws Exception {
        String id = UUID.randomUUID().toString();
        try (FileOutputStream out = new FileOutputStream(new File(inboxDir(), id + ".bin"))) {
            out.write(bytes);
        }
        JSONArray manifest = readManifest();
        manifest.put(new JSONObject().put("id", id).put("name", safeName(name)).put("size", bytes.length));
        writeManifest(manifest);
    }

    private File inboxDir() {
        File dir = new File(getContext().getFilesDir(), "inbox");
        dir.mkdirs();
        return dir;
    }

    private JSONArray readManifest() throws Exception {
        File file = new File(inboxDir(), "manifest.json");
        if (!file.exists()) return new JSONArray();
        return new JSONArray(new String(readFile(file), StandardCharsets.UTF_8));
    }

    private void writeManifest(JSONArray array) throws Exception {
        try (FileOutputStream out = new FileOutputStream(new File(inboxDir(), "manifest.json"))) {
            out.write(array.toString().getBytes(StandardCharsets.UTF_8));
        }
    }

    private JSONObject findMeta(String id) throws Exception {
        JSONArray manifest = readManifest();
        for (int i = 0; i < manifest.length(); i++) {
            JSONObject item = manifest.getJSONObject(i);
            if (id.equals(item.optString("id"))) return item;
        }
        return null;
    }

    private DocumentFile document(String uriString) {
        Uri uri = Uri.parse(uriString);
        DocumentFile tree = DocumentFile.fromTreeUri(getContext(), uri);
        if (tree != null && tree.exists() && tree.isDirectory()) return tree;
        return DocumentFile.fromSingleUri(getContext(), uri);
    }

    private String displayName(Uri uri) {
        try (android.database.Cursor cursor = getContext().getContentResolver().query(uri, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                if (name != null && !name.isBlank()) return name;
            }
        } catch (Exception ignored) {
            // Fall through to the path segment.
        }
        String last = uri.getLastPathSegment();
        if (last == null) return "shared";
        int slash = last.lastIndexOf('/');
        return slash >= 0 ? last.substring(slash + 1) : last;
    }

    private byte[] readBytes(Uri uri) throws Exception {
        try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
            if (input == null) return new byte[0];
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int read;
            long total = 0;
            while ((read = input.read(buf)) != -1) {
                total += read;
                if (total > MAX_BYTES) throw new IllegalStateException("NeoFile keeps shared files under 40 MB");
                out.write(buf, 0, read);
            }
            return out.toByteArray();
        }
    }

    private byte[] readFile(File file) throws Exception {
        try (InputStream input = new java.io.FileInputStream(file)) {
            return input.readAllBytes();
        }
    }

    private ArrayList<Uri> urisFrom(Intent data) {
        ArrayList<Uri> uris = new ArrayList<>();
        if (data == null) return uris;
        if (data.getClipData() != null) {
            for (int i = 0; i < data.getClipData().getItemCount(); i++) uris.add(data.getClipData().getItemAt(i).getUri());
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        return uris;
    }

    private String writeDownload(String name, String mime, byte[] bytes) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, name);
            values.put(MediaStore.Downloads.MIME_TYPE, mime);
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri != null) {
                try (java.io.OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                    if (out != null) out.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, values, null, null);
                return "Downloads/" + name;
            }
        }
        File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = getContext().getFilesDir();
        File file = new File(dir, name);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
        }
        return file.getAbsolutePath();
    }

    private String safeName(String name) {
        String cleaned = name.replaceAll("[\\\\/:*?\"<>|\\u0000-\\u001f]", "_").trim();
        while (cleaned.startsWith(".")) cleaned = cleaned.substring(1);
        if (cleaned.isBlank()) return "untitled";
        return cleaned.length() > 180 ? cleaned.substring(0, 180) : cleaned;
    }
}
