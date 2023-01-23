using Microsoft.VisualBasic;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Policy;
using System.Text;

namespace sigmanuts_webview2
{
    public class WidgetOperations
    {
        public static string CacheFolderPath => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Sigmanuts");
        private string WidgetsFolder = Path.Combine(CacheFolderPath, @".\localserver\widgets");


        public static async void CreateWidget(string widgetName, Microsoft.Web.WebView2.Wpf.WebView2 appView)
        {
            CreateWidgetFolder(widgetName);

            string PathToHTML = Path.Combine(CacheFolderPath, @$".\localserver\widgets\{widgetName}\src\html.html");
            string PathToCSS = Path.Combine(CacheFolderPath, @$".\localserver\widgets\{widgetName}\src\css.css");
            string PathToJS = Path.Combine(CacheFolderPath, @$".\localserver\widgets\{widgetName}\src\js.js");

            string EssentialJS = File.ReadAllText(Path.Combine(CacheFolderPath, @$".\localserver\widgets\{widgetName}\js.html"));

            string HTML = "";
            if (File.Exists(PathToHTML))
            {
                HTML = File.ReadAllText(PathToHTML);
            }

            string CSS = "";
            if (File.Exists(PathToHTML))
            {
                CSS = File.ReadAllText(PathToCSS);
            }

            string JS = "";
            if (File.Exists(PathToHTML))
            {
                JS = File.ReadAllText(PathToJS);
            }

            string widgetHTML = $"<html>" +
                $"<head>" +
                $"<meta http-equiv=\"Cache-control\" content=\"no-cache\">" +
                $"<style>" +
                $"{CSS}" +
                $"</style>" +
                $"</head>" +
                $"<body>" +
                $"{HTML}" +
                $"{EssentialJS}" +
                $"<script type=\"text/javascript\">" +
                $"{JS}" +
                $"</script>" +
                $"</body>" +
                $"</html>";

            string[] lines =
            {
                widgetHTML
                };

            await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @$".\localserver\widgets\{widgetName}\widget.html"), lines);
            await appView.CoreWebView2.ExecuteScriptAsync($"retrieveData().then(updateUI()); $('iframe').attr('src', `widgets/{widgetName}/widget.html`)");
        }

        public static string CreateWidgetFolder(string widgetName)
        {
            string fileToCopy = Path.Combine(CacheFolderPath, @$".\localserver\js.html");
            string widgetDirectory = Path.Combine(CacheFolderPath, @$".\localserver\widgets\{widgetName}");
            string srcDirectory = Path.Combine(widgetDirectory, "src");

            Directory.CreateDirectory(widgetDirectory);
            Directory.CreateDirectory(srcDirectory);
            if (File.Exists(Path.Combine(widgetDirectory, "js.html")))
            {
                File.Delete(Path.Combine(widgetDirectory, "js.html"));
            }

            File.Copy(fileToCopy, Path.Combine(widgetDirectory, "js.html"));

            return srcDirectory;
        }

        public void DeleteWidget(string widgetName)
        {

        }
    }
}
