using System;
using System.Collections.Generic;
using System.Linq;
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
using Microsoft.Web.WebView2.Core;

namespace sigmanuts_webview2
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public static string javascript =
            @"const callback = (mutationList, observer) => {
                console.log(mutationList)
                for (const mutation of mutationList) {
                    //console.log(mutation)

                    if (mutation.addedNodes.length == 0) {
                        continue
                    }

                    var eventData = mutation.addedNodes[0]['$']
                    //console.log(eventData)
                    var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;
                    var message = eventData.content.childNodes[3].childNodes[0].data;

                    var obj = JSON.stringify({
                        username: authorName,
                        message: message
                    });

                }
            };

            const observer = new MutationObserver(callback);
            observer.observe(document.querySelector(""yt-live-chat-item-list-renderer #items""), { subtree: false, childList: true });";

        public MainWindow()
        {
            InitializeComponent();
            InitializeAsync();
        }

        async void InitializeAsync()
        {
            await webView.EnsureCoreWebView2Async(null);
            webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;

        }

        private async void OnWebViewDOMContentLoaded(object sender, CoreWebView2DOMContentLoadedEventArgs arg)
        {
            webView.CoreWebView2.DOMContentLoaded -= OnWebViewDOMContentLoaded;

            webView.Focus();

            // now execute your javascript
            await webView.CoreWebView2.ExecuteScriptAsync(javascript);
        }
    }

}
