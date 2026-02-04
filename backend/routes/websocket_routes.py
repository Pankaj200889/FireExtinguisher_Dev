from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sockets import manager

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
            # We don't really expect messages from dashboard, 
            # but we need to keep the loop/connection open
    except WebSocketDisconnect:
        manager.disconnect(websocket)
