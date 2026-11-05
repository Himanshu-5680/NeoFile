package app.neofile.local;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NeoFilePlugin.class);
        super.onCreate(savedInstanceState);
        deliverShare(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        deliverShare(intent);
    }

    private void deliverShare(Intent intent) {
        if (getBridge() == null) return;
        PluginHandle handle = getBridge().getPlugin("NeoFile");
        if (handle != null && handle.getInstance() instanceof NeoFilePlugin) {
            ((NeoFilePlugin) handle.getInstance()).ingestIntent(intent);
        }
    }
}
