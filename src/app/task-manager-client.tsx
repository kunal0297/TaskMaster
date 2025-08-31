
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  CheckCircle2,
  Circle,
  Edit,
  LogOut,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as React from "react";
import { z } from "zod";

import { suggestTaskPrioritization } from "@/ai/flows/suggest-task-prioritization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Task, TaskEffort, TaskStatus } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(140),
  description: z.string().max(500).optional(),
  dueDate: z.date().optional(),
  estimatedEffort: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "completed"]),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function TaskManagerClient() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [filter, setFilter] = React.useState<TaskStatus | "all">("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const handleOpenDialog = (task: Task | null = null) => {
    setEditingTask(task);
    form.reset(
      task
        ? { ...task }
        : { title: "", description: "", status: "pending" }
    );
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: TaskFormData) => {
    if (editingTask) {
      setTasks(
        tasks.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t))
      );
      toast({ title: "Task updated successfully!" });
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        ...data,
      };
      setTasks([newTask, ...tasks]);
      toast({ title: "Task added successfully!" });
    }
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    toast({ title: "Task deleted.", variant: "destructive" });
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === "pending" ? "completed" : "pending",
            }
          : t
      )
    );
  };

  const getAiSuggestions = async () => {
    setIsAiLoading(true);
    try {
      const result = await suggestTaskPrioritization({
        tasks: tasks.map(({ title, description, dueDate, estimatedEffort }) => ({
          title,
          description,
          dueDate: dueDate?.toISOString(),
          estimatedEffort,
        })),
      });

      const updatedTasks = [...tasks];
      result.prioritizationSuggestions.forEach((suggestion) => {
        if (updatedTasks[suggestion.taskId]) {
          updatedTasks[suggestion.taskId].prioritizationReason = suggestion.reason;
        }
      });
      setTasks(updatedTasks);
      toast({
        title: "AI Suggestions Applied",
        description: "Prioritization reasons have been added to your tasks.",
      });
    } catch (error) {
      console.error("AI Prioritization Error:", error);
      toast({
        title: "Error getting AI suggestions",
        description: "Could not retrieve prioritization suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filter === "all" || task.status === filter;
    const searchMatch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">TaskMaster</h1>
          <p className="text-muted-foreground">Manage your tasks with intelligence.</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask
                    ? "Update the details of your task."
                    : "Fill in the details for your new task."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Deploy to production" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add more details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedEffort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Effort (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select effort level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {editingTask ? "Save Changes" : "Create Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {user?.email}
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>View, manage, and prioritize your tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <Tabs
              defaultValue="all"
              onValueChange={(value) => setFilter(value as TaskStatus | "all")}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:flex-1">
               <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={getAiSuggestions}
              disabled={isAiLoading}
              className="w-full sm:w-auto"
            >
              {isAiLoading ? (
                <span className="animate-pulse">Analyzing...</span>
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-accent" />
              )}
              Get AI Suggestions
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Effort</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id} className={cn(task.status === "completed" && "bg-muted/50")}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(task.id)}
                          aria-label={task.status === 'pending' ? 'Mark as completed' : 'Mark as pending'}
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground hidden sm:block">
                            {task.description}
                          </div>
                        )}
                        {task.prioritizationReason && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                            <Sparkles className="h-3 w-3" />
                            <span>{task.prioritizationReason}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.dueDate ? format(task.dueDate, "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {task.estimatedEffort ? (
                          <Badge variant="secondary" className="capitalize">
                            {task.estimatedEffort}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(task)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No tasks found. Create a new task to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
