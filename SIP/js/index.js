(() => {
    document.addEventListener('DOMContentLoaded', async () => {
        const credentials = await fetch(`${SAMPLE_SERVER_BASE_URL}/session`)
            .then(res => res.json());

        const conferenceDetails = await fetch(`${SAMPLE_SERVER_BASE_URL}/sip/session`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('conference-number').innerHTML = data.conferenceNumber;
                return data;
            });

        const session = OT.initSession(credentials.applicationId, credentials.sessionId);

        try {
            await session.connect.promise(credentials.token);
            const publisher = await OT.initPublisher.promise('publisher', {
                insertMode: 'append',
                width: '100%',
                height: '100%'
            });
            await session.publish.promise(publisher);
        } catch (error) {
            console.error(error);
        }

        session.on('streamCreated', async (event) => {
            try {
                await session.subscribe.promise(event.stream, 'subscribers', {
                    insertMode: 'append',
                    height: '100%',
                    width: '100%'
                });
            } catch (error) {
                console.error(error);
            }
        });

        document.getElementById('btn-dial-conference').addEventListener('click', async () => {
            const resp = await fetch(`${SAMPLE_SERVER_BASE_URL}/sip/session/dial`, {
                method: "POST"
            })
            .then(res => res.json())

            console.log(resp);
        });

        document.getElementById('btn-dial-number').addEventListener('click', async () => {
            const msisdn = document.getElementById('phone').value;
            const resp = await fetch(`${SAMPLE_SERVER_BASE_URL}/sip/session/dial`, {
                method: "POST",
                body: JSON.stringify({
                    msisdn
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())

            console.log(resp);
        });

        document.getElementById('btn-disconnect-conference').addEventListener('click', async () => {
            const resp = await fetch(`${SAMPLE_SERVER_BASE_URL}/sip/session/hangup`, {
                method: "POST"
            })
                .then(res => res.json())

            console.log(resp);
        });
    });
})();