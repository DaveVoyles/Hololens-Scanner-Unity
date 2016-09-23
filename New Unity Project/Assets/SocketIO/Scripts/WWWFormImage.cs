using System;
using UnityEngine;
using System.Collections;
using SocketIO;
using Debug = UnityEngine.Debug;

public class WWWFormImage : MonoBehaviour
{
    private TestSocketIO _testSocketScript;
    private SocketIOComponent _socket;

    private void OnMouseDown()
    {
        // Get sockets script
        GameObject go     = GameObject.Find("TestSocketObj");
        _testSocketScript = go.GetComponent<TestSocketIO>();
        _socket           = _testSocketScript.socket;

        Debug.Log("click");
        StartCoroutine(UploadPNG());
    }

    IEnumerator UploadPNG()
    {
        // We should only read the screen after all rendering is complete
        yield return new WaitForEndOfFrame();

        // Create a texture the size of the screen, RGB24 format
        int width  = Screen.width;
        int height = Screen.height;
        var tex    = new Texture2D(width, height, TextureFormat.RGB24, false);

        // Read screen contents into the texture
        tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
        tex.Apply();

        // Encode texture into PNG & apply it to cube
        byte[] bytes                        = tex.EncodeToPNG();
        var cubeRender                      = GameObject.Find("Cube").GetComponent<Renderer>();
            cubeRender.material.mainTexture = tex;

        // Prefefix is necessary to draw image on canvas.
        // Convert || img -> Byte Array -> String -> JSON obj
        string prefix       = "data:image/png;base64,";
        string tempInBase64 = Convert.ToBase64String(bytes);
        string payload      = prefix + tempInBase64;
        var jsonPayload     = JSONObject.StringObject(payload);

        Debug.Log("jsonPayload:" + jsonPayload);
        _socket.Emit("msgFromUnity", jsonPayload);

        //TODO: May not need to destroy this....
        // Destroy(tex);        
    }



}
