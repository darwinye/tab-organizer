## Getting the latest version ##
Ordinarily, users wait until I release a new version, then Chrome will automatically download and update it. This is very convenient, but also means users need to wait a while before they get new features, bug fixes, etc.

This page gives instructions on how to use the absolute latest version. This means you'll get bug fixes faster, be able to try out new features before other users, etc.

First, you will need [Mercurial](http://mercurial.selenic.com/wiki/Download). There are clients for Windows, Mac OS X, GNU/Linux, and others.

Once you have it installed, use the following command in a command prompt:
```
hg clone https://tab-organizer.googlecode.com/hg/ tab-organizer
```

  1. You should now have a folder called "tab-organizer".
  1. Within Chrome, go into the Extensions page with Wrench -> Tools -> Extensions.
  1. Make sure "Developer mode" is turned on, in the upper-right corner.
  1. Click on the button called "Load unpacked extension..."
  1. Browse to the folder "tab-organizer", then click OK/Open.

Within the Extensions page, there should now be an item called "Tab Organizer - Version: x.x (Unpacked)", where x.x is the most recent version. Note that it says (Unpacked) at the end.

Because you are now using the latest version, I recommend disabling the normal version of Tab Organizer, though you can use both at the same time, if you wish.

**Note:** If you uninstall an extension, it will also remove the extension's options. Instead, disable it.

**Note:** If you changed the options within Tab Organizer, you will need to do so again with the Unpacked version. They are completely separate from each other.

## Updating Tab Organizer ##
Chrome does not automatically update Unpacked extensions. Here are the steps to manually updating:
  1. Within a command prompt, go into the "tab-organizer" folder. The command "cd" usually does this:
```
cd tab-organizer
```
  1. Now use the following two commands:
```
hg pull
hg update
```
  1. Within Chrome, go into the Extensions page.
  1. Underneath the Unpacked Tab Organizer extension, click on the "Reload" link.

That's it! If you want to check whether I've made any changes or not, use [this link](http://code.google.com/p/tab-organizer/source/list).