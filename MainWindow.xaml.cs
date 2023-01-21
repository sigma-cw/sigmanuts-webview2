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
using System.Threading;
using System.Windows.Input;

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
            string folder = System.IO.Path.Combine(
                System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @".\web-src");
            SimpleHTTPServer myServer;

            new Thread(() => myServer = new SimpleHTTPServer(folder, 6969)) { IsBackground = true }.Start();
            new Thread(() => InitSignalR()) { IsBackground = true }.Start();

            Application.Current.Exit += CurrentOnExit;
        }

        private void CurrentOnExit(object sender, ExitEventArgs exitEventArgs)
        {
            try
            {
                // Delete WebView2 user data before application exits
                string? webViewCacheDir = webView.CoreWebView2.Environment.UserDataFolder;
                var webViewProcessId = Convert.ToInt32(webView.CoreWebView2.BrowserProcessId);
                var webViewProcess = Process.GetProcessById(webViewProcessId);

                // Shutdown browser with Dispose, and wait for process to exit
                webView.Dispose();
                webViewProcess.WaitForExit(3000);

                Directory.Delete(webViewCacheDir, true);
            }
            catch (Exception ex)
            {
                // log warning
            }

            Environment.Exit(0);
        }

        private void ButtonGo_Click(object sender, RoutedEventArgs e)
        {
            if (webView != null && webView.CoreWebView2 != null)
            {
                //webView.CoreWebView2.Navigate(addressBar.Text);
                webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;
            }
        }

        private async void InitializeAsync()
        {
            await webView.EnsureCoreWebView2Async(null);
            webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;
            //webView.CoreWebView2.WebMessageReceived += MessageReceived;

        }

        private async void MessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs args)
        {
            String content = args.TryGetWebMessageAsString();
            //Debug.WriteLine(content);
            
        }

        private async void OnWebViewDOMContentLoaded(object sender, CoreWebView2DOMContentLoadedEventArgs arg)
        {
            webView.CoreWebView2.DOMContentLoaded -= OnWebViewDOMContentLoaded;

            webView.Focus();

            string pathToScript = System.IO.Path.Combine(
                System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @".\web-src\js\script.js");
            string contents = File.ReadAllText(pathToScript);

            // now execute your javascript
            await webView.CoreWebView2.ExecuteScriptAsync(contents);
        }

        private async void OnNavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs arg)
        {
            webView.NavigationCompleted -= OnNavigationCompleted;

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


        private async void StopSignalR()
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

        // Can execute
        private void CommandBinding_CanExecute(object sender, CanExecuteRoutedEventArgs e)
        {
            e.CanExecute = true;
        }

        // Minimize
        private void CommandBinding_Executed_Minimize(object sender, ExecutedRoutedEventArgs e)
        {
            SystemCommands.MinimizeWindow(this);
        }

        // Maximize
        private void CommandBinding_Executed_Maximize(object sender, ExecutedRoutedEventArgs e)
        {
            SystemCommands.MaximizeWindow(this);
        }

        // Restore
        private void CommandBinding_Executed_Restore(object sender, ExecutedRoutedEventArgs e)
        {
            SystemCommands.RestoreWindow(this);
        }

        // Close
        private void CommandBinding_Executed_Close(object sender, ExecutedRoutedEventArgs e)
        {
            SystemCommands.CloseWindow(this);
        }

        // State change
        private void MainWindowStateChangeRaised(object sender, EventArgs e)
        {
            if (WindowState == WindowState.Maximized)
            {
                MainWindowBorder.BorderThickness = new Thickness(8);
                RestoreButton.Visibility = Visibility.Visible;
                MaximizeButton.Visibility = Visibility.Collapsed;
            }
            else
            {
                MainWindowBorder.BorderThickness = new Thickness(0);
                RestoreButton.Visibility = Visibility.Collapsed;
                MaximizeButton.Visibility = Visibility.Visible;
            }
        }
    }

}
