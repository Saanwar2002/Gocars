@echo off
echo Making deployment scripts executable...

REM On Windows, we don't need to set execute permissions
REM But we can verify the scripts exist

if exist "deploy.sh" (
    echo deploy.sh found
) else (
    echo ERROR: deploy.sh not found
)

if exist "undeploy.sh" (
    echo undeploy.sh found
) else (
    echo ERROR: undeploy.sh not found
)

echo.
echo Scripts are ready to use!
echo.
echo Usage:
echo   bash deploy.sh --environment production --image-tag v1.0.0
echo   bash undeploy.sh --force
echo.
pause