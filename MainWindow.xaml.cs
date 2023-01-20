using System;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using System.IO;
using Microsoft.Web.WebView2.Core;
using System.Diagnostics;
using Sigma.Hubs;
using Microsoft.Extensions.Hosting;
using System.ComponentModel;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Builder;

namespace sigmanuts_webview2
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private Microsoft.AspNetCore.SignalR.IHubContext<StreamHub> hubContext;

        public MainWindow()
        {
            InitializeComponent();
            InitializeAsync();

            // Start the server
            string folder = System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            SimpleHTTPServer myServer;

            Task.Run(() => myServer = new SimpleHTTPServer(folder, 6969));
            Task.Run(() => InitSignalR());
        }

        private async void InitializeAsync()
        {
            await webView.EnsureCoreWebView2Async(null);
            webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;
            webView.CoreWebView2.WebMessageReceived += MessageReceived;

        }

        private async void MessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs args)
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

        private IHost _host;

        private async void InitSignalR()
        {
            _host?.Dispose();
            _host = Host.CreateDefaultBuilder()
                .ConfigureWebHostDefaults(webBuilder => webBuilder
                    .UseUrls("http://localhost:6970")
                    .ConfigureServices(services => services.AddSignalR())
                    //.ConfigureServices(services => services.AddTransient<HubMethods<StreamHub>>())
                    .ConfigureServices(services => services.AddCors(
                            options =>
                            {
                                options.AddDefaultPolicy(
                                    webBuilder =>
                                    {
                                        webBuilder.WithOrigins("http://localhost:6969")
                                        .WithOrigins("https://www.youtube.com")
                                        .AllowAnyHeader()
                                        .WithMethods("GET", "POST")
                                        .AllowCredentials();
                                    });
                            }
                        ))
                    .Configure(app =>
                    {
                        app.UseCors();
                        app.UseRouting();
                        app.UseEndpoints(endpoints => endpoints.MapHub<StreamHub>("stream"));
                    }))
               .Build();

            await _host.StartAsync();
        }


        private async void StopSignalR(object sender, RoutedEventArgs e)
        {
            if (_host != null)
            {
                await _host.StopAsync();
                _host.Dispose();
            }
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            _host?.Dispose();
            base.OnClosing(e);
        }
    }

}
