using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Sigma.Hubs
{
    public class StreamHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            await Clients.Others.SendAsync("ReceiveMessage", user, message);
        }
    }
}