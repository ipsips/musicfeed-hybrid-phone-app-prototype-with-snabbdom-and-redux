#!/bin/bash

PLIST=platforms/ios/*/*-Info.plist

cat << EOF |
Add :NSAppTransportSecurity dict
Add :NSAppTransportSecurity:NSExceptionDomains dict
Add :NSAppTransportSecurity:NSExceptionDomains:musicfeed.rubyforce.co dict
Add :NSAppTransportSecurity:NSExceptionDomains:musicfeed.rubyforce.co:NSIncludesSubdomains bool YES
Add :NSAppTransportSecurity:NSExceptionDomains:musicfeed.rubyforce.co:NSExceptionAllowsInsecureHTTPLoads bool YES
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done

true