using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Sigma.Hubs
{
    public class StreamHub : Hub
    {
        public async Task SendMessage(string obj)
        {
            await Clients.Others.SendAsync("ReceiveMessage", obj);
        }
    }
}