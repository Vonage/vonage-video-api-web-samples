(() => {
    document.addEventListener('DOMContentLoaded', async () => {
        const credentials = await getCredentials('viewer');
        const session = OT.initSession(
            credentials.applicationId,
            credentials.sessionId,
            {
                connectEventsSuppressed: true
            }
        );

        try {
            await session.connect.promise(credentials.token);

            session.on('streamCreated', async (event) => {
                try {
                    await session.subscribe.promise(event.stream, 'host', {
                        insertMode: 'append',
                        width: '100%',
                        height: '100%',
                    });
                } catch (error) {
                    console.error(error);
                }
            });
        } catch (error) {
            console.log(error);
        }
    });
})();