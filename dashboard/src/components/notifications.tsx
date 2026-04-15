import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Mail, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, Notification } from "@/services/notifications"
import { formatDistanceToNow } from "date-fns"
import { useNavigate } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(1, 10)
      setNotifications(Array.isArray(res?.data) ? res.data : [])
      setUnreadCount(typeof res?.metadata?.unreadCount === 'number' ? res.metadata.unreadCount : 0)
    } catch (error) {
      console.error("Failed to fetch notifications", error)
      setNotifications([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every minute if visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification._id)
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Failed to mark as read", error)
      }
    }

    if (notification.link) {
      navigate({ to: notification.link as any })
      setIsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read", error)
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'review_requested':
        return <Mail className="h-3 w-3" />
      case 'changes_requested':
        return <AlertCircle className="h-3 w-3" />
      case 'published':
        return <CheckCircle className="h-3 w-3" />
      case 'comment':
        return <MessageSquare className="h-3 w-3" />
      default:
        return <Bell className="h-3 w-3" />
    }
  }

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'review_requested':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      case 'changes_requested':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
      case 'published':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'comment':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
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
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Inbox</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 border-b last:border-0",
                    !notification.read ? "bg-muted/20" : ""
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5",
                    getColors(notification.type)
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-tight truncate pr-2", !notification.read ? "font-semibold" : "font-medium")}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
