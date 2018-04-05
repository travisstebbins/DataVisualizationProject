Startup instructions modified from http://www.jhh.me/blog/2012/12/24/setting-up-http-server-on-windows-with-node-js/

It's easy to setup Node.js and install NPM apps on Windows systems. Here�s a guide how to setup a HTTP server. No programming skills required! (Basically it is the same process for any OS!)

1) First you must install NodeJS: https://nodejs.org/

2) Open the command prompt to run following commands.
Windows 7: Open Start and write cmd into the search and press enter.
Windows XP: Open Start and select Run and write cmd and press enter.
iOS: Open a terminal (Command+space to bring up spotlight. Type "Terminal" and press enter)

3) Run this command to install a HTTP server: npm install http-server -g

4) And start the HTTP server: "http-server path" without quotes, where "path" is the path to the root folder with your html (index.html). Your folder must have some files before it works.

5) Open http://localhost:8080/ in your browser.
