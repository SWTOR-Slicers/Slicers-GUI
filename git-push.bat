git checkout %1
git fetch origin %1
git rebase -i origin/%1
REM Squash commits, fix up commit messages etc.
git push origin %1