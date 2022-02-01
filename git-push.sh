#!/bin/sh
#
# Command to push commited changes to source control
#

exec git checkout $1
exec git fetch origin $1
exec git rebase -i origin/$1
# Squash commits, fix up commit messages etc.
exec git push origin $1