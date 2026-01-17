import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Mail, MessageSquare } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const mockNotifications = [
  {
    id: 1,
    title: "Review Request",
    description: "Sarah requested a review on 'The Future of AI'",
    time: "2 mins ago",
    type: "review",
    read: false,
  },
  {
    id: 2,
    title: "New Comment",
    description: "John commented on your article",
    time: "1 hour ago",
    type: "comment",
    read: false,
  },
  {
    id: 3,
    title: "System Update",
    description: "Dashboard scheduled maintenance tonight",
    time: "5 hours ago",
    type: "system",
    read: true,
  },
  {
    id: 4,
    title: "Article Published",
    description: "Your draft was published successfully",
    time: "1 day ago",
    type: "system",
    read: true,
  },
]

export function Notifications() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Mail className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Inbox</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <CardDescription>
              Recent activity and requests
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col">
                {mockNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <button
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                        !notification.read ? "bg-muted/20" : ""
                      }`}
                    >
                      <div className={`mt-1 p-2 rounded-full ${
                        notification.type === 'review' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        notification.type === 'comment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {notification.type === 'review' ? <Mail className="h-3 w-3" /> :
                         notification.type === 'comment' ? <MessageSquare className="h-3 w-3" /> :
                         <Bell className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm leading-none ${!notification.read ? "font-semibold" : "font-medium"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground pt-1">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                      )}
                    </button>
                    {index < mockNotifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-2 border-t text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs h-8">
              View all notifications
            </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
