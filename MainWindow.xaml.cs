using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.IO;
using Microsoft.Web.WebView2.Core;
using System.Text.Json.Serialization;
using System.Xml;
using System.Diagnostics;
using System.Threading;

namespace sigmanuts_webview2
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {

        public MainWindow()
        {
            InitializeComponent();
            InitializeAsync();

            // Start the server
            string folder = @"D:\Projects\SIGMANUTS\sigmanuts\widget";
            SimpleHTTPServer myServer;
            
            Task.Run(() => myServer = new SimpleHTTPServer(folder, 6969));
        }

        private async void InitializeAsync()
        {
            await webView.EnsureCoreWebView2Async(null);
            webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;
            webView.CoreWebView2.WebMessageReceived += MessageReceived;

        }

        private void MessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs args)
        {
            String content = args.TryGetWebMessageAsString();
            Debug.WriteLine(content);
        }

        private async void OnWebViewDOMContentLoaded(object sender, CoreWebView2DOMContentLoadedEventArgs arg)
        {
            webView.CoreWebView2.DOMContentLoaded -= OnWebViewDOMContentLoaded;

            webView.Focus();

            string pathToScript = System.IO.Path.Combine(
                System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "script.js");
            string contents = File.ReadAllText(pathToScript);

            // now execute your javascript
            await webView.CoreWebView2.ExecuteScriptAsync(contents);
        }
    }

}
