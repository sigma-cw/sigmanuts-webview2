using System;
using System.Reflection;
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
using System.Security.Policy;
using Microsoft.AspNetCore.Hosting.Server;
using Newtonsoft.Json;
using System.Threading.Tasks;

namespace sigmanuts_webview2
{
    /// <summary>
    /// This class is fairly loaded because I couldnt be bothered to split it up
    /// 
    /// Defined main app window, hosts SignalR instance for interaction between the app and 
    /// the server on which the widget is server, and handles window interactions.
    /// 
    /// If someone decides to organize it without losing any functionality, be my guest.
    /// </summary>
    public partial class MainWindow : Window
    {
        public static string CacheFolderPath => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Sigmanuts");

        private Microsoft.AspNetCore.SignalR.IHubContext<StreamHub> hubContext; // This is not used anymore, but I'll leave it here
        private bool isChatEnabled = false;
        private bool isPreviewEnabled = false;
        private static string currentWidget = "";

        /// <summary>
        /// URLs
        /// </summary>

        private string chatUrl = "http://localhost:6969/tutorial.html";//"https://www.youtube.com/live_chat?v=jfKfPfyJRdk"
        private string appUrl = "http://localhost:6969/app.html";
        private string widgetUrl = $"http://localhost:6969/widgets/{currentWidget}/widget.html";

        private SimpleHTTPServer myServer;

        public MainWindow()
        {
            try
            {
                InitializeComponent();
                Directory.CreateDirectory(Path.Combine(CacheFolderPath, @".\localserver\widgets"));

                if (!File.Exists(Path.Combine(CacheFolderPath, @".\localserver")))
                {
                    string sourceDirectory = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @".\web-src");
                    string targetDirectory = Path.Combine(CacheFolderPath, @".\localserver");

                    Debug.WriteLine(sourceDirectory);

                    DirectoryInfo diSource = new DirectoryInfo(sourceDirectory);
                    DirectoryInfo diTarget = new DirectoryInfo(targetDirectory);

                    CopyDir.CopyAll(diSource, diTarget);
                }

                HandleWidgets();

                Debug.WriteLine("Running...");

                new Thread(() => InitSignalR()) { IsBackground = true }.Start();

                // Start the server
                string folder = Path.Combine(CacheFolderPath, @".\localserver");
                myServer = new SimpleHTTPServer(folder, 6969);
                currentWidget = "";

                Application.Current.Exit += CurrentOnExit;
            }
            catch (Exception ex)
            {
                Directory.CreateDirectory(Path.Combine(CacheFolderPath, @".\crash-logs"));
                string[] exception =
                {
                    ex.Message };

                File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @".\crash-logs\latest.log"), exception);
            }
        }

        protected override async void OnInitialized(EventArgs e)
        {
            /// This method sets user data folder and initial URLs for
            /// app windows, as well as performs other startup things

            base.OnInitialized(e);
            var environment = await CoreWebView2Environment.CreateAsync(null, CacheFolderPath);

            await webView.EnsureCoreWebView2Async(environment);
            await appView.EnsureCoreWebView2Async(environment);
            await widgetView.EnsureCoreWebView2Async(environment);

            if (File.Exists(Path.Combine(CacheFolderPath, @".\localserver\config.ini")))
            {
                chatUrl = File.ReadAllText(Path.Combine(CacheFolderPath, @".\localserver\config.ini"));
            } 

            webView.Source = new UriBuilder(chatUrl).Uri;
            appView.Source = new UriBuilder(appUrl).Uri;

            widgetView.Source = new UriBuilder(widgetUrl).Uri;
            widgetView.DefaultBackgroundColor = System.Drawing.Color.Transparent;

            appView.CoreWebView2.WebMessageReceived += HandleWebMessage;
            webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;

            appView.DefaultBackgroundColor = System.Drawing.Color.Transparent;

        }

        private void CurrentOnExit(object sender, ExitEventArgs exitEventArgs)
        {
            /// This method exists to delete the user data folder upon exit
            /// It's deprecated now that the UDF is stored inside AppData/Local/
            /// Keep it, but forget about this.

            try
            {
                // Delete WebView2 user data before application exits
                string? webViewCacheDir = Path.Combine(CacheFolderPath, @".\EBWebView\Default\Cache");
                var webViewProcessId = Convert.ToInt32(webView.CoreWebView2.BrowserProcessId);
                var webViewProcess = Process.GetProcessById(webViewProcessId);

                // Shutdown browser with Dispose, and wait for process to exit
                webView.Dispose();
                webViewProcess.WaitForExit(2000);

                //Disabling cache deletion
                Directory.Delete(webViewCacheDir, true);
            }
            catch (Exception ex)
            {
                // log warning
            }

            Environment.Exit(0);
        }

        /// <summary>
        /// Logic for JS interaction
        /// </summary>
        /// 
        public async void HandleWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs args)
        {
            if (args == null)
            {
                return;
            }

            String content = args.TryGetWebMessageAsString();

            dynamic stuff = JsonConvert.DeserializeObject(content);

            switch (stuff.listener.ToString())
            {
                case "toggle-chat":
                    ToggleChat(Boolean.Parse(stuff.value.ToString()));
                    break;

                case "toggle-fullscreen":
                    ToggleFullscreen();
                    break;

                case "toggle-login":
                    ToggleLogin();
                    break;

                case "change-url":
                    string url = stuff.value;
                    webView.CoreWebView2.Navigate(url);
                    webView.CoreWebView2.DOMContentLoaded += OnWebViewDOMContentLoaded;
                    string[] lines =
                        {
                            url
                        };

                    await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @".\localserver\config.ini"), lines);
                    break;

                case "change-widget":
                    currentWidget = stuff.value;
                    string[] current =
                        {
                            currentWidget
                        };

                    await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @".\localserver\widgets\activeWidget.active"), current);
                    widgetUrl = $"http://localhost:6969/widgets/{currentWidget}/widget.html";
                    widgetView.CoreWebView2.Navigate(widgetUrl);
                    break;

                case "widget-load":
                    string widgetData = stuff.value;
                    string widgetName = stuff.name;

                    string[] dataToWrite = { widgetData };
                    try
                    {
                        await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, $@".\localserver\widgets\{widgetName}\src\data.txt"), dataToWrite);
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine(ex.ToString());
                    }

                    break;

                case "create-widget":
                    string name = stuff.name;
                    string _srcDir = WidgetOperations.CreateWidgetFolder(name);
                    HandleWidgets();
                    break;

                case "populate-widget":
                    string _name = stuff.name;

                    string HTML = stuff.htmlvalue;
                    string CSS = stuff.cssvalue;
                    string JS = stuff.jsvalue;
                    string FIELDS = stuff.fieldsvalue;
                    string DATA = stuff.datavalue;

                    string[] _HTML = { HTML };
                    string[] _CSS = { CSS };
                    string[] _JS = { JS };
                    string[] _FIELDS = { FIELDS };
                    string[] _DATA = { DATA };

                    string widgetDirectory = Path.Combine(CacheFolderPath, @$".\localserver\widgets\{_name}");
                    string srcDirectory = Path.Combine(widgetDirectory, "src");

                    await File.WriteAllLinesAsync(Path.Combine(srcDirectory, @".\html.html"), _HTML);
                    await File.WriteAllLinesAsync(Path.Combine(srcDirectory, @".\css.css"), _CSS);
                    await File.WriteAllLinesAsync(Path.Combine(srcDirectory, @".\js.js"), _JS);
                    await File.WriteAllLinesAsync(Path.Combine(srcDirectory, @".\fields.json"), _FIELDS);
                    await File.WriteAllLinesAsync(Path.Combine(srcDirectory, @".\data.txt"), _DATA);

                    WidgetOperations.CreateWidget(_name, appView);

                    HandleWidgets();
                    widgetUrl = $"http://localhost:6969/widgets/{currentWidget}/widget.html";
                    widgetView.CoreWebView2.Navigate(widgetUrl);
                    break;

                case "refresh-widget":
                    string _name_ = stuff.name;
                    Debug.WriteLine(_name_);
                    WidgetOperations.CreateWidget(_name_, appView);
                    widgetView.CoreWebView2.Navigate(widgetUrl);
                    break;

                case "delete-widget":
                    string __name_ = stuff.name;
                    string widgetDir = Path.Combine(CacheFolderPath, @$".\localserver\widgets\{__name_}");
                    Directory.Delete(widgetDir, true);
                    HandleWidgets();

                    string[] clearActive = { "" };
                    await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @".\localserver\widgets\activeWidget.active"), clearActive);
                    await appView.CoreWebView2.ExecuteScriptAsync($"retrieveData().then(updateUI()); $('iframe').attr('src', ``)");
                    break;

                case "test-message":
                    string type = stuff.type;
                    await webView.CoreWebView2.ExecuteScriptAsync("testMessage('" + type + "')");
                    break;

                case "open-folder":
                    Process.Start("explorer.exe",Path.Combine(CacheFolderPath, @".\localserver\widgets\"));
                    break;

                default:
                    break;
            }
        }

        public void ToggleChat(bool active)
        {
            /// Simple function to toggle chat visibility on and off.
            /// 
            /// I am aware that I can change Visibility to Hidden or Collapsed,
            /// it's done by setting Height to 0 for a reason. YouTube chat pauses if not focused.
            /// Do not ask about this.
            if (isChatEnabled == active) return;
            isChatEnabled = active;

            if (isChatEnabled)
            {
                appView.HorizontalAlignment = HorizontalAlignment.Left;
                appView.Width = 51;
                //
                /*
                if (WindowState == WindowState.Maximized)
                {
                    var margin = new Thickness(0, 0, window.ActualWidth - 51, 0);
                    appView.Margin = margin;
                }
                else
                {
                    var margin = new Thickness(0, 0, window.ActualWidth - 51, 0);
                    appView.Margin = margin;
                }*/
            }
            else
            {
                appView.HorizontalAlignment = HorizontalAlignment.Stretch;
                appView.Width = Double.NaN;
                /*
                var margin = new Thickness(0, 0, 0, 0);
                appView.Margin = margin;*/
            }
        }

        public void ToggleLogin()
        {
            ToggleChat(true);
            webView.CoreWebView2.Navigate("https://www.youtube.com/account");
        }

        public async void ToggleFullscreen()
        {
            /// Simple function to toggle fullscreen preview visibility on and off.

            if (!File.Exists(Path.Combine(CacheFolderPath, $@".\localserver\widgets\{currentWidget.Replace("\r\n", string.Empty)}\widget.html")))
            {
                return;
            }

            isPreviewEnabled = !isPreviewEnabled;

            if (isPreviewEnabled)
            {
                if (WindowState == WindowState.Maximized)
                {
                    widgetView.Height = window.ActualHeight - 110;
                }
                else
                {
                    widgetView.Height = window.ActualHeight - 94;
                }
            }
            else
            {
                widgetView.Height = 0;
            }

            await appView.CoreWebView2.ExecuteScriptAsync("$('.fullscreen').toggle('fast');");
        }

        

        public async void HandleWidgets()
        {

            if (File.Exists(Path.Combine(CacheFolderPath, @".\localserver\widgets\activeWidget.active")))
            {
                currentWidget = File.ReadAllText(Path.Combine(CacheFolderPath, @".\localserver\widgets\activeWidget.active"));
            }
            else
            {
                string[] current =
                {
                    ""
                };

                await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @".\localserver\widgets\activeWidget.active"), current);
            }

            try
            {
                string[] dirs = Directory.GetDirectories(Path.Combine(CacheFolderPath, @".\localserver\widgets"), "*", SearchOption.TopDirectoryOnly);
                await File.WriteAllLinesAsync(Path.Combine(CacheFolderPath, @$".\localserver\widgets\widgets.ini"), dirs);
            }
            catch (Exception e)
            {
                Debug.WriteLine("The process failed: {0}", e.ToString());
            }

        }


        /// <summary>
        /// Listening for JS events
        /// </summary>
        private async void OnWebViewDOMContentLoaded(object sender, CoreWebView2DOMContentLoadedEventArgs arg)
        {
            /// This function injects scraping script into YouTube live chat. 

            webView.CoreWebView2.DOMContentLoaded -= OnWebViewDOMContentLoaded;
            webView.Focus();

            string pathToScript = System.IO.Path.Combine(
                System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @".\web-src\js\script.js");
            string contents = File.ReadAllText(pathToScript);

            await webView.CoreWebView2.ExecuteScriptAsync(contents);
        }

        private async void OnNavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs arg)
        {
            /// I know this function is basically equivalent OnWebViewDOMContentLoaded...
            /// I just couldn't be bothered to generalize these since I'm not gonna be
            /// expanding on any functionality on these events

            webView.NavigationCompleted -= OnNavigationCompleted;
            webView.Focus();

            string pathToScript = System.IO.Path.Combine(
                System.IO.Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), @".\web-src\js\script.js");
            string contents = File.ReadAllText(pathToScript);

            await webView.CoreWebView2.ExecuteScriptAsync(contents);
        }

        /// <summary>
        /// Methods related to the SignalR instance.
        /// Some of the methods are unused, but I'm keeping them just in case. 
        /// Do not suggest to delete those.
        /// </summary>

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

        /// <summary>
        /// Interaction logic for MainWindow.xaml
        /// </summary>

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
        {/*
            isPreviewEnabled = false;
            widgetView.Height = 0;

            isChatEnabled = false;
            var margin = new Thickness(0, 0, 0, 0);
            appView.Margin = margin;*/
            SystemCommands.MaximizeWindow(this);
        }

        // Restore
        private void CommandBinding_Executed_Restore(object sender, ExecutedRoutedEventArgs e)
        {/*
            isPreviewEnabled = false;
            widgetView.Height = 0;

            isChatEnabled = false;
            var margin = new Thickness(0, 5, 0, 0);
            appView.Margin = margin;*/
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