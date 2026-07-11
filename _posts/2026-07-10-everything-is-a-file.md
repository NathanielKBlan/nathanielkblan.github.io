---
layout: post
title:  "Everything Is a File"
date:   2026-07-10 22:05:42 -0400
categories: IO
excerpt: "In *nix, everything is a file (sortof)"
readtime: "5 min read"
---

In the linux and unix operating systems everything is a file. Well not literally but the phrase describes a common pattern used to interact with these operating systems. It is through manipulating file descriptors that programmers can interact with I/O devices, disk partitions, and even processes themselves. But what are they?

## What Is a File Descriptor?

Firstly a file descriptor is basically just a non-negative integer that identifies any input/output resource (files included). This is neet because it gives the programmer a common api for which to interact with I/O.

Each process running in the Linux operating system has a set of open file descriptors associated with it (actually it's more of a map as we'll see shortly). This set can be accessed by reading from the proc directory: `ls -l /proc/PID/fd`

For example if I run `ls -l /proc/self/fd` then I'll see the open file descriptors associated with my current shell:

```
total 0
lrwx------ 1 nate nate 64 Jul 10 20:55 0 -> /dev/pts/0
lrwx------ 1 nate nate 64 Jul 10 20:55 1 -> /dev/pts/0
lrwx------ 1 nate nate 64 Jul 10 20:55 2 -> /dev/pts/0
lr-x------ 1 nate nate 64 Jul 10 20:55 3 -> /proc/2336340/fd
```

The first three file descriptors here correspond to _standard input_, _standard output_, and _standard error_ respectively. Another way to read this is that the three I/O descriptors point to the current psuedo terminal `/dev/pts/0`.

Now you may be wondering how this is possible. In the Linux kernel each process has filesystem information associated with it via a structure called files_struct:

[Linux Kernel files_struct definition](https://elixir.bootlin.com/linux/v7.1.3/source/include/linux/fdtable.h#L38)
```c
/*
 * Open file table structure
 */
struct files_struct {
  /*
   * read mostly part
   */
	atomic_t count;
	bool resize_in_progress;
	wait_queue_head_t resize_wait;

	struct fdtable __rcu *fdt;
	struct fdtable fdtab;
  /*
   * written part on a separate cache line in SMP
   */
	spinlock_t file_lock ____cacheline_aligned_in_smp;
	unsigned int next_fd;
	unsigned long close_on_exec_init[1];
	unsigned long open_fds_init[1];
	unsigned long full_fds_bits_init[1];
	struct file __rcu * fd_array[NR_OPEN_DEFAULT];
};
```

Peering closer into it one notices the fdtable structure:

[Linux Kernel fdtable Definition](https://elixir.bootlin.com/linux/v7.1.3/source/include/linux/fdtable.h#L26)
```c
struct fdtable {
	unsigned int max_fds;
	struct file __rcu **fd;      /* current fd array */
	unsigned long *close_on_exec;
	unsigned long *open_fds;
	unsigned long *full_fds_bits;
	struct rcu_head rcu;
};
```


Notice the fd array, this is where file descriptors play a role. My shell process above if it wanted to fetch one of those terminal devices would use 0, 1, or 2 as the index for the fd array (hence why file descriptors are represented as non-negative integers).

## Interacting w/ File Descriptors

In order to interact with file descriptors Linux provides some key system calls to do so:

- `open(path, flags, mode)` [POSIX open](https://pubs.opengroup.org/onlinepubs/007904875/functions/open.html)
- `read(fd, buffer, count)` [POSIX read](https://pubs.opengroup.org/onlinepubs/009604599/functions/read.html)
- `write(fd, buffer, count)` [POSIX write](https://pubs.opengroup.org/onlinepubs/9699919799/functions/write.html)
- `close(fd)` [POSIX close](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html)

These are some of the basic ones, there are others such as `lseek` and `ioctl` but I've yet to use these extensively.

The usage of these is pretty straight forward with some caveats for read and write.

Back when I was taking my OS class I figured that I can just make both my buffer and count absurdly large in order to make less calls to read and write, however your OS will determine how many bytes it wants to flush out, so don't assume that your calls to read and write will return the exact same count you specified. The same goes for sockets as well which are interacted with through this same file descriptor api.

## Resources for Further Reading
- [The POSIX Standard](https://pubs.opengroup.org/onlinepubs/9799919799/)
- [fdtable.h](https://elixir.bootlin.com/linux/v7.1.3/source/include/linux/fdtable.h)

\-Nate