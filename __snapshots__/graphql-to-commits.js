exports['graphqlToCommits converts raw graphql response into Commits object 1'] = {
  "endCursor": "0a8477108a26aeb21d7af06e62be4ae5cb00ad42 31",
  "hasNextPage": true,
  "commits": [
    {
      "sha": "0a8477108a26aeb21d7af06e62be4ae5cb00ad42",
      "message": "fix: Update PubSub timeouts. (#1967)",
      "files": [
        "PubSub/src/V1/resources/subscriber_client_config.json",
        "PubSub/synth.metadata"
      ]
    },
    {
      "sha": "269cf923ea6fd0375abaf0bb19790475693c6f90",
      "message": "fix: Assorted minor fixes for Cloud Datastore client (#1964)",
      "files": [
        "Datastore/src/Connection/Grpc.php",
        "Datastore/src/DatastoreClient.php",
        "Datastore/src/Entity.php",
        "Datastore/src/EntityIterator.php",
        "Datastore/src/EntityMapper.php",
        "Datastore/src/Key.php",
        "Datastore/src/Operation.php",
        "Datastore/src/TransactionTrait.php"
      ]
    },
    {
      "sha": "da356f004ff891e11a369fd634f55d6abade708f",
      "message": "Prepare v0.102.0 (#1965)",
      "files": [
        "AutoMl/VERSION",
        "Debugger/VERSION",
        "Debugger/src/DebuggerClient.php",
        "Dialogflow/VERSION",
        "Firestore/VERSION",
        "Firestore/src/FirestoreClient.php",
        "Language/VERSION",
        "Language/src/LanguageClient.php",
        "Speech/VERSION",
        "Speech/src/SpeechClient.php",
        "Tasks/VERSION",
        "Vision/VERSION",
        "Vision/src/VisionClient.php",
        "WebSecurityScanner/VERSION",
        "composer.json",
        "docs/manifest.json",
        "src/ServiceBuilder.php",
        "src/Version.php"
      ]
    },
    {
      "sha": "fa5761e9e52f36506a72a9292843259d198468b0",
      "message": "feat: Add Web Security Center Client (#1961)\n\n* add synth script\r\n\r\n* generate web security scanner\r\n\r\n* add to docs site\r\n\r\n* update README\r\n\r\n* update composer\r\n\r\n* remove whitespace in sample\r\n\r\n* add phpunit config\r\n\r\n* add hyperlink\r\n\r\n* autoload tests\r\n\r\n* more autoload fixes",
      "files": [
        "README.md",
        "WebSecurityScanner/.gitattributes",
        "WebSecurityScanner/.github/pull_request_template.md",
        "WebSecurityScanner/CONTRIBUTING.md",
        "WebSecurityScanner/LICENSE",
        "WebSecurityScanner/README.md",
        "WebSecurityScanner/composer.json",
        "WebSecurityScanner/metadata/V1Beta/CrawledUrl.php",
        "WebSecurityScanner/metadata/V1Beta/Finding.php",
        "WebSecurityScanner/metadata/V1Beta/FindingAddon.php",
        "WebSecurityScanner/metadata/V1Beta/FindingTypeStats.php",
        "WebSecurityScanner/metadata/V1Beta/ScanConfig.php",
        "WebSecurityScanner/metadata/V1Beta/ScanConfigError.php",
        "WebSecurityScanner/metadata/V1Beta/ScanRun.php",
        "WebSecurityScanner/metadata/V1Beta/ScanRunErrorTrace.php",
        "WebSecurityScanner/metadata/V1Beta/ScanRunWarningTrace.php",
        "WebSecurityScanner/metadata/V1Beta/WebSecurityScanner.php",
        "WebSecurityScanner/phpunit.xml.dist",
        "WebSecurityScanner/src/V1beta/CrawledUrl.php",
        "WebSecurityScanner/src/V1beta/CreateScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/DeleteScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/Finding.php",
        "WebSecurityScanner/src/V1beta/FindingTypeStats.php",
        "WebSecurityScanner/src/V1beta/Form.php",
        "WebSecurityScanner/src/V1beta/Gapic/WebSecurityScannerGapicClient.php",
        "WebSecurityScanner/src/V1beta/GetFindingRequest.php",
        "WebSecurityScanner/src/V1beta/GetScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/GetScanRunRequest.php",
        "WebSecurityScanner/src/V1beta/ListCrawledUrlsRequest.php",
        "WebSecurityScanner/src/V1beta/ListCrawledUrlsResponse.php",
        "WebSecurityScanner/src/V1beta/ListFindingTypeStatsRequest.php",
        "WebSecurityScanner/src/V1beta/ListFindingTypeStatsResponse.php",
        "WebSecurityScanner/src/V1beta/ListFindingsRequest.php",
        "WebSecurityScanner/src/V1beta/ListFindingsResponse.php",
        "WebSecurityScanner/src/V1beta/ListScanConfigsRequest.php",
        "WebSecurityScanner/src/V1beta/ListScanConfigsResponse.php",
        "WebSecurityScanner/src/V1beta/ListScanRunsRequest.php",
        "WebSecurityScanner/src/V1beta/ListScanRunsResponse.php",
        "WebSecurityScanner/src/V1beta/OutdatedLibrary.php",
        "WebSecurityScanner/src/V1beta/README.md",
        "WebSecurityScanner/src/V1beta/ScanConfig.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Authentication.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Authentication/CustomAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Authentication/GoogleAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/ExportToSecurityCommandCenter.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/RiskLevel.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Schedule.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/TargetPlatform.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/UserAgent.php",
        "WebSecurityScanner/src/V1beta/ScanConfigError.php",
        "WebSecurityScanner/src/V1beta/ScanConfigError/Code.php",
        "WebSecurityScanner/src/V1beta/ScanConfigError_Code.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Authentication.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Authentication_CustomAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Authentication_GoogleAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_ExportToSecurityCommandCenter.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_RiskLevel.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Schedule.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_TargetPlatform.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_UserAgent.php",
        "WebSecurityScanner/src/V1beta/ScanRun.php",
        "WebSecurityScanner/src/V1beta/ScanRun/ExecutionState.php",
        "WebSecurityScanner/src/V1beta/ScanRun/ResultState.php",
        "WebSecurityScanner/src/V1beta/ScanRunErrorTrace.php",
        "WebSecurityScanner/src/V1beta/ScanRunErrorTrace/Code.php",
        "WebSecurityScanner/src/V1beta/ScanRunErrorTrace_Code.php",
        "WebSecurityScanner/src/V1beta/ScanRunWarningTrace.php",
        "WebSecurityScanner/src/V1beta/ScanRunWarningTrace/Code.php",
        "WebSecurityScanner/src/V1beta/ScanRunWarningTrace_Code.php",
        "WebSecurityScanner/src/V1beta/ScanRun_ExecutionState.php",
        "WebSecurityScanner/src/V1beta/ScanRun_ResultState.php",
        "WebSecurityScanner/src/V1beta/StartScanRunRequest.php",
        "WebSecurityScanner/src/V1beta/StopScanRunRequest.php",
        "WebSecurityScanner/src/V1beta/UpdateScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/ViolatingResource.php",
        "WebSecurityScanner/src/V1beta/VulnerableHeaders.php",
        "WebSecurityScanner/src/V1beta/VulnerableHeaders/Header.php",
        "WebSecurityScanner/src/V1beta/VulnerableHeaders_Header.php",
        "WebSecurityScanner/src/V1beta/VulnerableParameters.php",
        "WebSecurityScanner/src/V1beta/WebSecurityScannerClient.php",
        "WebSecurityScanner/src/V1beta/WebSecurityScannerGrpcClient.php",
        "WebSecurityScanner/src/V1beta/Xss.php",
        "WebSecurityScanner/src/V1beta/resources/web_security_scanner_client_config.json",
        "WebSecurityScanner/src/V1beta/resources/web_security_scanner_descriptor_config.php",
        "WebSecurityScanner/src/V1beta/resources/web_security_scanner_rest_client_config.php",
        "WebSecurityScanner/synth.metadata",
        "WebSecurityScanner/synth.py",
        "WebSecurityScanner/tests/Unit/V1beta/WebSecurityScannerClientTest.php",
        "composer.json",
        "docs/contents/cloud-web-security-scanner.json",
        "docs/contents/google-cloud.json",
        "docs/manifest.json"
      ]
    },
    {
      "sha": "8db7f3b19c46c873897d79c89ce35b8492e5fe60",
      "message": "feat!: move speech from alpha -> beta (#1962)",
      "files": [
        "README.md",
        "Speech/README.md"
      ]
    },
    {
      "sha": "52f4fbfa1fc3fde585c84e64ef40571d2b85d72e",
      "message": "fix: correctly label as beta (#1963)",
      "files": [
        "AutoMl/README.md"
      ]
    },
    {
      "sha": "da6e52d956c1e35d19e75e0f2fdba439739ba364",
      "message": "feat: Add mp3 encoding and context hint boost support. (#1959)",
      "files": [
        "Speech/metadata/V1P1Beta1/CloudSpeech.php",
        "Speech/src/V1p1beta1/RecognitionConfig/AudioEncoding.php",
        "Speech/src/V1p1beta1/SpeechContext.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "bf69d0f204474b88b3f8b5a72a392129d16a3929",
      "message": "fix: language system test (#1958)",
      "files": [
        "Language/tests/System/AnalyzeTest.php"
      ]
    },
    {
      "sha": "a8b5b0bc9e9ed7998e30983834f7d841b6a37d6f",
      "message": "fix: continue switch targeting warning in PHP 7.3 (#1957)",
      "files": [
        "Debugger/src/Agent.php"
      ]
    },
    {
      "sha": "cf52ec0bcdc777dc9c5e76153d7d253bea95d44b",
      "message": "feat: Add Collection Group Query support (#1944)\n\n* Add Collection Group Query support\r\n\r\n* Fix documentation\r\n\r\n* Address code review\r\n\r\n* Throw from createDocumentReference",
      "files": [
        "Firestore/src/Connection/Grpc.php",
        "Firestore/src/FieldPath.php",
        "Firestore/src/FirestoreClient.php",
        "Firestore/src/Query.php",
        "Firestore/src/SnapshotTrait.php",
        "Firestore/tests/Snippet/CollectionReferenceTest.php",
        "Firestore/tests/Snippet/FieldPathTest.php",
        "Firestore/tests/Snippet/FirestoreClientTest.php",
        "Firestore/tests/Snippet/QueryTest.php",
        "Firestore/tests/System/CollectionGroupTest.php",
        "Firestore/tests/System/FirestoreTestCase.php",
        "Firestore/tests/Unit/CollectionReferenceTest.php",
        "Firestore/tests/Unit/FieldPathTest.php",
        "Firestore/tests/Unit/FirestoreClientTest.php",
        "Firestore/tests/Unit/QueryTest.php"
      ]
    },
    {
      "sha": "ad9f0bcd33f33f718d02a916f3777d5a89fa1caa",
      "message": "[CHANGE ME] Re-generated Vision to pick up changes in the API or client library generator. (#1954)",
      "files": [
        "Vision/src/V1/Product.php",
        "Vision/src/V1/ProductSearchParams.php",
        "Vision/synth.metadata"
      ]
    },
    {
      "sha": "31ca3ccea630ab5c164a21a30753ee617f5a3978",
      "message": "docs: Documentation updates. (#1956)",
      "files": [
        "Dialogflow/metadata/V2/Agent.php",
        "Dialogflow/metadata/V2/Context.php",
        "Dialogflow/metadata/V2/EntityType.php",
        "Dialogflow/metadata/V2/Intent.php",
        "Dialogflow/metadata/V2/Session.php",
        "Dialogflow/metadata/V2/SessionEntityType.php",
        "Dialogflow/src/V2/Intent.php",
        "Dialogflow/src/V2/Intent/Message/Platform.php",
        "Dialogflow/src/V2/QueryResult.php",
        "Dialogflow/synth.metadata"
      ]
    },
    {
      "sha": "f67dc1c24b2704e6b1fd0aea35340691b7ee33c9",
      "message": "feat: Add Stackdriver logging config, update documentation. (#1950)",
      "files": [
        "Tasks/metadata/V2/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Queue.php",
        "Tasks/src/V2/AppEngineHttpRequest.php",
        "Tasks/src/V2/CloudTasksGrpcClient.php",
        "Tasks/src/V2/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2/ListQueuesRequest.php",
        "Tasks/src/V2/ListTasksRequest.php",
        "Tasks/src/V2beta3/AppEngineHttpRequest.php",
        "Tasks/src/V2beta3/CloudTasksGrpcClient.php",
        "Tasks/src/V2beta3/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2beta3/HttpRequest.php",
        "Tasks/src/V2beta3/ListQueuesRequest.php",
        "Tasks/src/V2beta3/ListTasksRequest.php",
        "Tasks/src/V2beta3/OAuthToken.php",
        "Tasks/src/V2beta3/OidcToken.php",
        "Tasks/src/V2beta3/Queue.php",
        "Tasks/src/V2beta3/StackdriverLoggingConfig.php",
        "Tasks/src/V2beta3/Task.php",
        "Tasks/synth.metadata",
        "Tasks/tests/Unit/V2beta3/CloudTasksClientTest.php"
      ]
    },
    {
      "sha": "d323a48a3d6aeb659eb45927e16b1da9532c84a9",
      "message": "feat: Add recognition metadata, result end time and language code. (#1949)",
      "files": [
        "Speech/metadata/V1/CloudSpeech.php",
        "Speech/src/V1/RecognitionConfig.php",
        "Speech/src/V1/RecognitionMetadata.php",
        "Speech/src/V1/RecognitionMetadata/InteractionType.php",
        "Speech/src/V1/RecognitionMetadata/MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata/OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata/RecordingDeviceType.php",
        "Speech/src/V1/RecognitionMetadata_InteractionType.php",
        "Speech/src/V1/RecognitionMetadata_MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata_OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata_RecordingDeviceType.php",
        "Speech/src/V1/StreamingRecognitionResult.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "58cf48947669b05e3bde5203b030aaf0b1becd52",
      "message": "Prepare v0.101.1 (#1948)",
      "files": [
        "Asset/VERSION",
        "BigQueryDataTransfer/VERSION",
        "Bigtable/VERSION",
        "Bigtable/src/BigtableClient.php",
        "Container/VERSION",
        "Dataproc/VERSION",
        "Debugger/VERSION",
        "Debugger/src/DebuggerClient.php",
        "Dialogflow/VERSION",
        "Dlp/VERSION",
        "ErrorReporting/VERSION",
        "Firestore/VERSION",
        "Firestore/src/FirestoreClient.php",
        "Iot/VERSION",
        "Kms/VERSION",
        "Language/VERSION",
        "Language/src/LanguageClient.php",
        "Logging/VERSION",
        "Logging/src/LoggingClient.php",
        "Monitoring/VERSION",
        "OsLogin/VERSION",
        "PubSub/VERSION",
        "PubSub/src/PubSubClient.php",
        "Redis/VERSION",
        "Scheduler/VERSION",
        "Spanner/VERSION",
        "Spanner/src/SpannerClient.php",
        "Speech/VERSION",
        "Speech/src/SpeechClient.php",
        "Tasks/VERSION",
        "TextToSpeech/VERSION",
        "Trace/VERSION",
        "Trace/src/TraceClient.php",
        "VideoIntelligence/VERSION",
        "Vision/VERSION",
        "Vision/src/VisionClient.php",
        "composer.json",
        "docs/manifest.json",
        "src/ServiceBuilder.php",
        "src/Version.php"
      ]
    },
    {
      "sha": "9e71bb94a4de1ebd09ceb1f4177258ccba9d48c8",
      "message": "Skip commit in release builder (#1947)",
      "files": [
        "dev/src/ReleaseBuilder/ReleaseBuilder.php"
      ]
    },
    {
      "sha": "3ed713a94e29a51ee1b1820de7022556e2152250",
      "message": "Revert \"Add Stackdriver logging config, update documentation. (#1942)\" (#1946)\n\nThis reverts commit 73e2fc4a0e7258329e85cea7e1e9781bdffcaa2c.",
      "files": [
        "Tasks/metadata/V2/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Queue.php",
        "Tasks/src/V2/AppEngineHttpRequest.php",
        "Tasks/src/V2/CloudTasksGrpcClient.php",
        "Tasks/src/V2/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2/ListQueuesRequest.php",
        "Tasks/src/V2/ListTasksRequest.php",
        "Tasks/src/V2beta3/AppEngineHttpRequest.php",
        "Tasks/src/V2beta3/CloudTasksGrpcClient.php",
        "Tasks/src/V2beta3/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2beta3/HttpRequest.php",
        "Tasks/src/V2beta3/ListQueuesRequest.php",
        "Tasks/src/V2beta3/ListTasksRequest.php",
        "Tasks/src/V2beta3/OAuthToken.php",
        "Tasks/src/V2beta3/OidcToken.php",
        "Tasks/src/V2beta3/Queue.php",
        "Tasks/src/V2beta3/StackdriverLoggingConfig.php",
        "Tasks/src/V2beta3/Task.php",
        "Tasks/synth.metadata",
        "Tasks/tests/Unit/V2beta3/CloudTasksClientTest.php"
      ]
    },
    {
      "sha": "0b5a29e7297ff7a9c5ab419bd5fe8966dc0c9160",
      "message": "Revert \"Add recognition metadata, result end time and language code. (#1941)\" (#1945)\n\nThis reverts commit ed9f34f3e6d7e66e30f85b36d614e5e7b31b1ef7.",
      "files": [
        "Speech/metadata/V1/CloudSpeech.php",
        "Speech/src/V1/RecognitionConfig.php",
        "Speech/src/V1/RecognitionMetadata.php",
        "Speech/src/V1/RecognitionMetadata/InteractionType.php",
        "Speech/src/V1/RecognitionMetadata/MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata/OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata/RecordingDeviceType.php",
        "Speech/src/V1/RecognitionMetadata_InteractionType.php",
        "Speech/src/V1/RecognitionMetadata_MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata_OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata_RecordingDeviceType.php",
        "Speech/src/V1/StreamingRecognitionResult.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "ed9f34f3e6d7e66e30f85b36d614e5e7b31b1ef7",
      "message": "feat: Add recognition metadata, result end time and language code. (#1941)",
      "files": [
        "Speech/metadata/V1/CloudSpeech.php",
        "Speech/src/V1/RecognitionConfig.php",
        "Speech/src/V1/RecognitionMetadata.php",
        "Speech/src/V1/RecognitionMetadata/InteractionType.php",
        "Speech/src/V1/RecognitionMetadata/MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata/OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata/RecordingDeviceType.php",
        "Speech/src/V1/RecognitionMetadata_InteractionType.php",
        "Speech/src/V1/RecognitionMetadata_MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata_OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata_RecordingDeviceType.php",
        "Speech/src/V1/StreamingRecognitionResult.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "4521998bc2189675c796bade005eeb2723752e4c",
      "message": "docs: Update documentation. (#1943)",
      "files": [
        "Vision/src/V1/InputConfig.php",
        "Vision/synth.metadata"
      ]
    },
    {
      "sha": "73e2fc4a0e7258329e85cea7e1e9781bdffcaa2c",
      "message": "feat: Add Stackdriver logging config, update documentation. (#1942)",
      "files": [
        "Tasks/metadata/V2/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Queue.php",
        "Tasks/src/V2/AppEngineHttpRequest.php",
        "Tasks/src/V2/CloudTasksGrpcClient.php",
        "Tasks/src/V2/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2/ListQueuesRequest.php",
        "Tasks/src/V2/ListTasksRequest.php",
        "Tasks/src/V2beta3/AppEngineHttpRequest.php",
        "Tasks/src/V2beta3/CloudTasksGrpcClient.php",
        "Tasks/src/V2beta3/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2beta3/HttpRequest.php",
        "Tasks/src/V2beta3/ListQueuesRequest.php",
        "Tasks/src/V2beta3/ListTasksRequest.php",
        "Tasks/src/V2beta3/OAuthToken.php",
        "Tasks/src/V2beta3/OidcToken.php",
        "Tasks/src/V2beta3/Queue.php",
        "Tasks/src/V2beta3/StackdriverLoggingConfig.php",
        "Tasks/src/V2beta3/Task.php",
        "Tasks/synth.metadata",
        "Tasks/tests/Unit/V2beta3/CloudTasksClientTest.php"
      ]
    },
    {
      "sha": "bb7e5b98d1ba61945eebd6bf1db62b58f4b1e4a4",
      "message": "fix: Update retry configuration (#1940)",
      "files": [
        "Scheduler/src/V1/resources/cloud_scheduler_client_config.json",
        "Scheduler/src/V1beta1/resources/cloud_scheduler_client_config.json",
        "Scheduler/synth.metadata"
      ]
    },
    {
      "sha": "48f9be064ac1ecead7e4c2575557952ff668501b",
      "message": "fix: Update retry configuration (#1933)",
      "files": [
        "Vision/src/V1/resources/image_annotator_client_config.json",
        "Vision/src/V1/resources/product_search_client_config.json",
        "Vision/synth.metadata"
      ]
    },
    {
      "sha": "906ed070241e4d70c8b35bb63a9721f762250a11",
      "message": "fix: Update retry configuration (#1932)",
      "files": [
        "VideoIntelligence/src/V1/Gapic/VideoIntelligenceServiceGapicClient.php",
        "VideoIntelligence/src/V1/resources/video_intelligence_service_client_config.json",
        "VideoIntelligence/src/V1beta2/resources/video_intelligence_service_client_config.json",
        "VideoIntelligence/synth.metadata",
        "VideoIntelligence/tests/System/V1/VideoIntelligenceServiceSmokeTest.php",
        "VideoIntelligence/tests/Unit/V1/VideoIntelligenceServiceClientTest.php"
      ]
    },
    {
      "sha": "0fbfa6889dbe968eb8e16a9c6b6e5e98de8f7120",
      "message": "fix: Update retry configuration (#1931)",
      "files": [
        "Trace/src/V2/resources/trace_service_client_config.json",
        "Trace/synth.metadata"
      ]
    },
    {
      "sha": "d5e8cfb3fe272173c2c9f758ea469de44d6dc35a",
      "message": "fix: Update retry configuration (#1930)",
      "files": [
        "TextToSpeech/src/V1/resources/text_to_speech_client_config.json",
        "TextToSpeech/synth.metadata"
      ]
    },
    {
      "sha": "694ee38f3de591167376e70e2563d94ee5c20e42",
      "message": "fix: Update retry configuration (#1929)",
      "files": [
        "Tasks/src/V2/resources/cloud_tasks_client_config.json",
        "Tasks/src/V2beta2/resources/cloud_tasks_client_config.json",
        "Tasks/src/V2beta3/resources/cloud_tasks_client_config.json",
        "Tasks/synth.metadata"
      ]
    },
    {
      "sha": "9172873c62212de1df612f4ccba3babf44e3d1e1",
      "message": "fix: Update retry configuration (#1928)",
      "files": [
        "Speech/src/V1/resources/speech_client_config.json",
        "Speech/src/V1p1beta1/resources/speech_client_config.json",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "7059b29494b42d5779f77c65e44d730df6dc0822",
      "message": "fix: Update retry configuration (#1927)",
      "files": [
        "Spanner/src/Admin/Database/V1/resources/database_admin_client_config.json",
        "Spanner/src/Admin/Instance/V1/resources/instance_admin_client_config.json",
        "Spanner/synth.metadata"
      ]
    },
    {
      "sha": "8885e309cf69409d6734eb7f41ebd77c729ee290",
      "message": "fix: Update retry configuration (#1926)",
      "files": [
        "Redis/src/V1/resources/cloud_redis_client_config.json",
        "Redis/src/V1beta1/resources/cloud_redis_client_config.json",
        "Redis/synth.metadata"
      ]
    },
    {
      "sha": "8c5753c7822219ea99648ea220b1f092742afc34",
      "message": "fix: Update retry configuration (#1925)",
      "files": [
        "PubSub/src/V1/resources/publisher_client_config.json",
        "PubSub/synth.metadata"
      ]
    },
    {
      "sha": "f96ed362253b5f552955ec1e6879d2119ce35a35",
      "message": "fix: Update retry configuration (#1924)",
      "files": [
        "OsLogin/src/V1/resources/os_login_service_client_config.json",
        "OsLogin/src/V1beta/resources/os_login_service_client_config.json",
        "OsLogin/synth.metadata"
      ]
    }
  ]
}

exports['graphqlToCommits uses label for conventional commit prefix, if no prefix provided 1'] = {
  "endCursor": "fcd1c890dc1526f4d62ceedad561f498195c8939 99",
  "hasNextPage": true,
  "commits": [
    {
      "sha": "fcd1c890dc1526f4d62ceedad561f498195c8939",
      "message": "Refactor shared IAM-based signing (#292)\n\n* Extract IAM signing into its own class\r\n\r\n* Refactor into IamUtils package private class\r\n\r\n* Remove unnecessary class\r\n\r\n* Remove unused code\r\n\r\n* Cleanup imports\r\n\r\n* Fill out javadoc for IamUtils\r\n\r\n* Failing tests for impersonated credentials\r\n\r\n* Fix credentials used for signing\r\n\r\n* Fix providing delegates to signing request\r\n\r\n* Disallow null additionalFields, remove jsr305 annotation\r\n\r\n* Remove usued imports",
      "files": []
    },
    {
      "sha": "1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373",
      "message": "Update allowed header format (#301)\n\n* Update copyright format  \r\n\r\n@chingor13\r\n\r\n* Update java.header\r\n\r\n* add legacy copyright\r\n\r\n* remove spurious $",
      "files": []
    },
    {
      "sha": "3006009a2b1b2cb4bd5108c0f469c410759f3a6a",
      "message": "Upgrade Guava to 28.0-android (#300)",
      "files": []
    },
    {
      "sha": "35abf13fa8acb3988aa086f3eb23f5ce1483cc5d",
      "message": "fix: Fix declared dependencies from merge issue (#291)",
      "files": []
    },
    {
      "sha": "9b14268e2901dd4e82e20d0bec6f87ef4c37cc10",
      "message": "Log warnings and deprecate AppEngineCredentials.getApplicationDefault (#288)\n\n* Log warnings and deprecate AppEngineCredentials.getApplicationDefault\r\n\r\nUsers should use GoogleCredentials.getApplicationDefault() if they want\r\nADC.\r\n\r\nADC will never return com.google.auth.appengine.AppEngineCredentials.\r\n\r\n* Add test for warning message\r\n\r\n* Catch the IOException from default credentials",
      "files": []
    },
    {
      "sha": "09e415ad348ace1e2c8912f7af8868f6cf11e574",
      "message": "Adds CI test for mvn dependency:analyze and fixes missing deps (#289)\n\n* Add CI test for dependency:analyze\r\n\r\n* Remove unused dependencies\r\n\r\n* Fix path in dependency test file\r\n\r\n* Fix typo",
      "files": []
    },
    {
      "sha": "70767e3758aaaf4db25e316e3fb689be415a897f",
      "message": "feat!: Implement ServiceAccountSigner for ImpersonatedCredentials (#279)\n\n* Add Signer for impersonatied credentials\r\n\r\n* add lint fixes\r\n\r\n* back to the future\r\n\r\n* Update oauth2_http/java/com/google/auth/oauth2/ImpersonatedCredentials.java\r\n\r\nCo-Authored-By: Jeff Ching <chingor@google.com>",
      "files": []
    },
    {
      "sha": "fcbc42656b393351f6d29b341cdafde25d3f7087",
      "message": "Update dependency org.apache.maven.plugins:maven-javadoc-plugin to v3.1.1 (#287)",
      "files": []
    },
    {
      "sha": "19a9ba57e40c9f627c9efc29d460b7181c099635",
      "message": "Update instructions for google-auth-library-appengine artifact (#278)\n\n* Update instructions for google-auth-library-appengine artifact\r\n\r\n* Fix AppEngine -> App Engine and Java 10 -> 11\r\n\r\n* GoogleCredentials -> Credentials in README example",
      "files": []
    },
    {
      "sha": "f212149e99d45fedcda525f418d5eefd0e6d75f1",
      "message": "Bump next snapshot (#285)",
      "files": []
    },
    {
      "sha": "59edf251df08008e1f412968bd9103c9b441e81a",
      "message": "Release v0.16.2 (#284)",
      "files": []
    },
    {
      "sha": "bb7d80d4b5fc90f50e99c1db41863bcd212678da",
      "message": "Autorelease should actually autorelease",
      "files": []
    },
    {
      "sha": "c166c13e41866435ef3e0072afb4f6b2a20cbc59",
      "message": "Add metadata-flavor header to metadata server ping for compute engine (#283)",
      "files": []
    },
    {
      "sha": "0a5443ada6a440fd30c862b4b673b84ea66bc08d",
      "message": "Group AppEngine packages for renovate",
      "files": []
    },
    {
      "sha": "f81f3daf60db334b564733b859ec4c0ac556bef8",
      "message": "import http client bom for dependency management (#268)",
      "files": []
    },
    {
      "sha": "cccdfdb41cc2b9d50da6490b0e2cba3425d96a24",
      "message": "README section for interop with google-http-client (#275)\n\nAdds an example using `HttpCredentialsAdapter`",
      "files": []
    },
    {
      "sha": "4701056d32d95fd1133910889bd7611ca5369587",
      "message": "Autorelease will also auto publish (#271)\n\n* Autorelease will also auto publish\r\n\r\n* Remove debug echo",
      "files": []
    },
    {
      "sha": "0d2b93f90979ec56e13e327ba9cec33f65d0548e",
      "message": "Bump next snapshot (#270)",
      "files": []
    },
    {
      "sha": "537e710cd3a5ec842229b1642715664efcdb766c",
      "message": "Release v0.16.1 (#269)",
      "files": []
    },
    {
      "sha": "1091092283d9e223cf389d885abe416c76394423",
      "message": "Add credentials for autorelease (#267)",
      "files": []
    },
    {
      "sha": "2cedd9a1f7a7d82f670398dba055b46ed24e3d60",
      "message": "Update dependency com.google.http-client:google-http-client to v1.30.1 (#265)",
      "files": []
    },
    {
      "sha": "311950919858b75afcf9e06cd2306fad054bbf09",
      "message": "Bump next snapshot (#264)",
      "files": []
    },
    {
      "sha": "81ff35215931b047cd21957b376efd14c8234320",
      "message": "Add developers section to google-auth-library-bom pom.xml",
      "files": []
    },
    {
      "sha": "397a32ad4a63414d2cc7eae96550cabf4d21011a",
      "message": "Release v0.16.0 (#263)",
      "files": []
    },
    {
      "sha": "e918fd90252653f16aaf8038518ffb71dbdbd494",
      "message": "Update dependency com.google.http-client:google-http-client to v1.30.0 (#261)",
      "files": []
    },
    {
      "sha": "6c776ae6415bb347c9b87205867e7c517b6cf04f",
      "message": "Update dependency com.google.http-client:google-http-client to v1.29.2 (#259)",
      "files": []
    },
    {
      "sha": "78c2b58e0e8efc20d53c4f9de56b971b199b534c",
      "message": "Update dependency org.sonatype.plugins:nexus-staging-maven-plugin to v1.6.8 (#257)",
      "files": []
    },
    {
      "sha": "1f987babc52340982faaecbb6ac35dc3c3a263e0",
      "message": "Update to latest app engine SDK version (#258)",
      "files": []
    },
    {
      "sha": "dfca2f600d7664562b30d0fe63fe734ddb9946e3",
      "message": "Add google-auth-library-bom artifact (#256)",
      "files": []
    },
    {
      "sha": "124aea52cdd9aaf491b1df04ef9abd3e8b1ee198",
      "message": "Update dependency org.apache.maven.plugins:maven-source-plugin to v3.1.0 (#254)",
      "files": []
    },
    {
      "sha": "8e4f3429dbec388ed91f5440549205fd2160cf40",
      "message": "Update dependency org.jacoco:jacoco-maven-plugin to v0.8.4 (#255)",
      "files": []
    },
    {
      "sha": "559ef11b0755021b48211c7c7f1b6f4631ce7aac",
      "message": "Update dependency org.apache.maven.plugins:maven-jar-plugin to v3.1.2 (#252)",
      "files": []
    },
    {
      "sha": "fcb1da38217301b01108ae07d10a444dc82ec625",
      "message": "Update dependency org.apache.maven.plugins:maven-source-plugin to v2.4 (#253)",
      "files": []
    },
    {
      "sha": "bc047c10cad6ce031ec731c6577c58f85a9326fb",
      "message": "Add renovate.json (#245)",
      "files": []
    },
    {
      "sha": "7c28e941dbdebf588b3a0fa4e06bb5d2a1f13c1f",
      "message": "Javadoc publish kokoro job uses docpublisher (#243)\n\n* Javadoc publish kokoro job uses docpublisher\r\n\r\n* Fix config path\r\n\r\n* Fix site:stage config\r\n\r\n* Move config to reporting\r\n\r\n* Fix indent",
      "files": []
    },
    {
      "sha": "e336dd29ef7421dd24ffadd4c8abaa2132c5d270",
      "message": "Bump next snapshot (#240)",
      "files": []
    },
    {
      "sha": "f4354c12c2400897e54fad45644dcb7b94c10afc",
      "message": "Release v0.15.0 (#239)",
      "files": []
    },
    {
      "sha": "88b381079ad5d2a6dadfbbfa132a85cb3cd58fbc",
      "message": "Add back in deprecated methods in ServiceAccountJwtAccessCredentials (#238)\n\n* Add back in deprecated methods in ServiceAccountJwtAccessCredentials\r\n\r\n* typo fix\r\n\r\n* change constructor to private\r\n\r\n* change constructor to private",
      "files": []
    },
    {
      "sha": "49b39ae6beb9a054b9739cafe76059b0978a3067",
      "message": "Bump next snapshot (#237)",
      "files": []
    },
    {
      "sha": "6698b3f6b5ab6017e28f68971406ca765807e169",
      "message": "createScoped: make overload call implementation (#229)\n\nCall `createScoped` implementation instead of endlessly recursing.",
      "files": []
    },
    {
      "sha": "6ad960441490636afd8d260e04a588a30efbba1a",
      "message": "Release v0.14.0 (#236)",
      "files": []
    },
    {
      "sha": "135d4ff4ca085ffb4a861804dc8656f1b49d5a2b",
      "message": "Upgrade http client to 1.29.0. (#235)",
      "files": []
    },
    {
      "sha": "4c8360ee81b81b8d235141ee1d791acc8e350019",
      "message": "update default metadata url (#230)",
      "files": []
    },
    {
      "sha": "e1e1f044782c5f3624fd576e321ec21784c79f45",
      "message": "Update README.md (#233)\n\nfixed typo.",
      "files": []
    },
    {
      "sha": "f1b1c73fa3fd31e4832fac29296f948a7472e4ff",
      "message": "update deps (#234)",
      "files": []
    },
    {
      "sha": "5db77026fb0a2859fc6933b23623f0e97ea9f125",
      "message": "Update Sign Blob API (#232)",
      "files": []
    },
    {
      "sha": "44a5d33f8a9554192af1302d58f1dcab47cd2568",
      "message": "Remove deprecated methods (#190)\n\n* add App Engine API to pom.xml with test scope\r\n\r\n* remove deprecated methods\r\n\r\n* remove one more deprecated comment\r\n\r\n* 1.9.71 appngine api",
      "files": []
    },
    {
      "sha": "e8b569be8db680169057688ae45f29916406e47e",
      "message": "Provide STAGING_REPOSITORY_ID as an environment variable (#226)",
      "files": []
    },
    {
      "sha": "999de3b11de320354a8ff80a8dc906723d708cf4",
      "message": "Bump next snapshot (#225)",
      "files": []
    },
    {
      "sha": "ee78958511100ec71c123d634c84ba7c0554d480",
      "message": "Release v0.13.0 (#224)",
      "files": []
    },
    {
      "sha": "1d44ecd1e55fb6470cf3e03ed3c7e318df204445",
      "message": "Enable autorelease (#222)",
      "files": []
    },
    {
      "sha": "ee67b5de492aea70c9b41b22bd53d75a1ea190c8",
      "message": "Update google-http-client version and maven surefire plugin (#221)",
      "files": []
    },
    {
      "sha": "af3ae7530ffba1d4a3f0614dce28ba98862f290a",
      "message": "Use OutputStream directly instead of PrintWriter (#220)",
      "files": []
    },
    {
      "sha": "48faeab8c9432d121a171d00ac2997dec3afbbbf",
      "message": "Tests: Enable a test that was missing the test annotation (#219)\n\n* Enable a test that was missing the test annotation\r\n\r\n* Remove debug statement",
      "files": []
    },
    {
      "sha": "9f40bc7d6dd1e101c9ce1eaef44658f12ed763c3",
      "message": "Overload GoogleCredentials.createScoped with variadic arguments (#218)\n\n* Add variadic overload of GoogleCredentials.createScoped\r\n\r\n* Remove unused import",
      "files": []
    },
    {
      "sha": "a1bbc4f4b6e26f123c462aca0aad7b53cd37d930",
      "message": "Add kokoro job for publishing javadoc to GCS (#217)\n\n* Add kokoro job for publishing javadoc to GCS\r\n\r\n* Use string for Kokoro env var and default LINK_LATEST to true",
      "files": []
    },
    {
      "sha": "e311be7adb496d1a2bdad104203528240d3fa7ae",
      "message": "Improve log output when detecting GCE (#214)\n\nImproving the log output when unexpected exceptions occur while determining\r\nif the client is running on Google Compute Engine.\r\n\r\nMoving the stacktrace to be FINE output since stacktraces are alarming.\r\n\r\nMaking the INFO level log message occur only once instead of potentially many times.\r\n\r\nFurther improvements to #199 and #198",
      "files": []
    },
    {
      "sha": "24164bfefc3ab1fe7f66ed3a6c674e7789c7ac6f",
      "message": "Bump next snapshot (#216)",
      "files": []
    },
    {
      "sha": "f3415decbda6a99730b3a479f6f76328362446de",
      "message": "Release v0.12.0 (#213)",
      "files": []
    },
    {
      "sha": "8225b92f88cc33edddcd0d4643ca1d9096cb1855",
      "message": "Cleanup ImpersonatedCredentials (#212)\n\n* Cleanup\r\n\r\n* Fix tests\r\n\r\n* No need for singular ERROR_PREFIX that doesn't provide extra information\r\n\r\n* Fix spelling error",
      "files": []
    },
    {
      "sha": "b037146c665029ca4b764fe21bd3d7452dbc0ea3",
      "message": "Add ImpersonatedCredentials (#211)\n\n* Add impersonatedcredentials\r\n\r\n* constructors->private; handle errors as IOException",
      "files": []
    },
    {
      "sha": "1b5f8ac5c6e53d8c074d5a86f7055310956ba2c2",
      "message": "Update google-http-java-client dependency to 1.27.0 (#208)",
      "files": []
    },
    {
      "sha": "415f91b1cc6e0cdae934a14aa41c4b4d1affb3a6",
      "message": "Update README with instructions on installing the App Engine SDK and running the tests (#209)",
      "files": []
    },
    {
      "sha": "4598c3fbbb6b036f11381f09f83b2144eea26b8b",
      "message": "Option to suppress end user credentials warning. (#207)\n\n* Option to suppress end user credentials warning.\r\n\r\nDefining a new environment variable SUPPRESS_GCLOUD_CREDS_WARNING.\r\nSetting this to true suppresses the end user credentials warning.\r\nFixes #193\r\n\r\n* reordering checks to respond to comment",
      "files": []
    },
    {
      "sha": "108df92031a42dd070b86464e5efa85a3bcf33e3",
      "message": "Add note about NO_GCE_CHECK to Metadata 404 Error (#205)\n\nThis makes the workaround to issue #204 much easier to discover.",
      "files": []
    },
    {
      "sha": "cdcf5897b21bec9a49d4198ad27eb1682ceef7d0",
      "message": "Show error message in case of problems with getting access token (#206)\n\nCurrently it's unclear what caused the problem with it",
      "files": []
    },
    {
      "sha": "eb7e8457f6f4d501a009bcd2eb560f8ad4cbdf23",
      "message": "Kokoro release (#200)\n\n* Add publish and stage release Kokoro configs\r\n\r\n* Fix credentials\r\n\r\n* Use trampoline for releases\r\n\r\n* Make release scripts executable\r\n\r\n* Fix release directory\r\n\r\n* Fix pin-entry for gpg signing\r\n\r\n* temporarily bump version, fix artifact path\r\n\r\n* Try to get the nice artifact path",
      "files": []
    },
    {
      "sha": "e75322bcef3e835043b075749935be0d91fa2c99",
      "message": "Enable releasetool (#202)\n\n* Enable releasetool versioning\r\n\r\n* Release notes\r\n\r\n* Fix type\r\n\r\n* remove extra declared versions",
      "files": []
    },
    {
      "sha": "9e9ddb1660ef7a627dd4341b539234f316ca41b5",
      "message": "Add codecov (#201)\n\n* Add codecov\r\n\r\n* Get codecov credentials, run local codecov script\r\n\r\n* Add jacoco-maven-plugin for code coverage\r\n\r\n* Add java11 test config\r\n\r\n* Add codecov badge to README\r\n\r\n* Check that codecov creds are present, use gcs version\r\n\r\n* output format of test report\r\n\r\n* Remove codecov script, only use gcs version",
      "files": []
    },
    {
      "sha": "9ef4ab1563e84e0f5579747fa6e575a2e71fc736",
      "message": "Add CODEOWNERS and issue/pr templates (#203)",
      "files": []
    },
    {
      "sha": "a6585aeb5a81961fddf5382740c22768c75759ed",
      "message": "Fix snapshot version in pom files and fix urls after repo move (#196)\n\n* Fix snapshot version in pom files and fix urls after repo move\r\n\r\n* fix repo and link in update_javadoc.sh script",
      "files": []
    },
    {
      "sha": "248fdb2557354430b3a1811924878c9f8a224031",
      "message": "Fix warnings (#199)\n\n* Fix javadoc warnings\r\n\r\n* Only output message for GCE detection failure at INFO level",
      "files": []
    },
    {
      "sha": "1a004a3a4a0a7c1623ce777db614c5b0812bdcc5",
      "message": "Add Kokoro continuous job configs (#197)\n\n* Add continuous integration Kokoro configs\r\n\r\n* Add CI Status section to README",
      "files": []
    },
    {
      "sha": "f739f2f33256bdc93b2312521b38dc56780fc090",
      "message": "README grammar fix (#192)\n\n* grammar fix\r\n\r\n* Update README.md",
      "files": []
    },
    {
      "sha": "169c4d70423e731a6c651065db9fbfaca284ade2",
      "message": "Add unstable badge to README (#184)",
      "files": []
    },
    {
      "sha": "3101a0242394b9f9bda38263dedaa296f7c7afcc",
      "message": "Add windows Kokoro test config (#181)\n\n* Add windows Kokoro test config\r\n\r\n* Fix location of build.bat\r\n\r\n* Fix windows working directory\r\n\r\n* Fix bath to build script\r\n\r\n* Use a tempfile for test files to avoid windows path issues\r\n\r\n* empty commit to trigger travis\r\n\r\n* Skip creating the temporary test json files.\r\n\r\nThe actual file is not necessary for the tests - we only need a valid\r\npath for the OS.\r\n\r\n* Fix joining of paths\r\n\r\n* Fix osx script",
      "files": []
    },
    {
      "sha": "42c9906bc3b93cdb9766c2ef4a379670dab6d9f8",
      "message": "Fix assorted warnings (#186)\n\n* warnings\r\n\r\n* revert",
      "files": []
    },
    {
      "sha": "15601f48fac4ed2eb8662ad976e33e601e8849f9",
      "message": "0.11.0 has been released (#182)",
      "files": []
    },
    {
      "sha": "b87c763c55f960374a7f439af675bad4549ff5e0",
      "message": "Add Kokoro CI config (#180)\n\n* Add Kokoro CI config\r\n\r\n* Fix directory",
      "files": []
    },
    {
      "sha": "64435cf60583a802564e40b3914b46e23c00b282",
      "message": "Release v0.11.0 (#179)",
      "files": []
    },
    {
      "sha": "f7fc855cdd9d34e57aaa501ffc66e5372c960f51",
      "message": "Documentation for ComputeEngineCredential signing. (#176)\n\nAdding note about enabling the IAM API and requiring the\r\niam.serviceAccounts.signBlob permission.",
      "files": []
    },
    {
      "sha": "1b0f73404c064a82c5501c394b8fe922ea8b3cff",
      "message": "Update new token urls (#174)",
      "files": []
    },
    {
      "sha": "df46fd3c67ceccc721878e8bd0a42c2906d36243",
      "message": "Bumping google-http-client version (#171)\n\n* Bumping google-http-client version\r\n\r\n* Bumping checkstyle to fix mac build",
      "files": []
    },
    {
      "sha": "185658cff1927664dde487819f6dbaa7e7a98923",
      "message": "update dependencies (#170)",
      "files": []
    },
    {
      "sha": "da0541304a994eb48f765b88b5b8911d3bdfc702",
      "message": "fix link (#169)",
      "files": []
    },
    {
      "sha": "c357d9ddf87f06c8ad05ef41b09a9c7dae752900",
      "message": "0.10.1-SNAPSHOT version bump (#168)",
      "files": []
    },
    {
      "sha": "cb13da113c4d907ee8aafeab712757867276a7ed",
      "message": "Bump release to 0.10.0 (#167)",
      "files": []
    },
    {
      "sha": "8964e7cf71d311ee910f144db2f768149c577363",
      "message": "Allows to use GCE service credentials to sign blobs (#150)\n\nFixes #141 \r\n\r\n* Allows to use GCE service credentials to sign blobs (#141)\r\n\r\n* Fix failing test (#141)\r\n\r\n* Improve error reporting (#141)\r\n\r\n* Fix issues for code review (#141)\r\n\r\n* Don't change ServiceAccountSigner method signatures\r\n* Use complete list of imports in ComputeEngineCredentials\r\n\r\n* Restore individual assert imports\r\n\r\n* No need for IAM_API_ROOT_URL constant\r\n\r\n* Add tests for failure cases",
      "files": []
    },
    {
      "sha": "13c2418a6c511765761de9e52a9f03016044dae8",
      "message": "Log warning if default credentials yields a user token from gcloud sdk (#166)\n\n* Log warning if default credentials yields a user token from gcloud sdk\r\n\r\n* Address PR comments",
      "files": []
    },
    {
      "sha": "4c311eeec807e8cfd37f3cd0b14a088cdd9f1362",
      "message": "Add documentation note that getAccessToken() returns cached value (#162)",
      "files": []
    },
    {
      "sha": "64b48cbfc5805c6c8f3c8645bf1885ecbc4f6198",
      "message": "Add OAuth2Credentials#refreshIfExpired() (#163)\n\n* Add OAuth2Credentials#refreshIfExpired()\r\n\r\n* Update README with info on explicit credential loading/refreshing",
      "files": []
    },
    {
      "sha": "6cc107359226ab2c70c9b2d066ddf726e27a92b7",
      "message": "Versionless docs (#164)\n\n* Copy docs release version to latest folder\r\n\r\n* Update link to documentation to latest",
      "files": []
    },
    {
      "sha": "cbc6c1062d5fe1920c6a641a4d63769b56267eb0",
      "message": "Read token_uri from service account JSON. (#160)",
      "files": []
    },
    {
      "sha": "8658eb1b6a4e1e458de715a50e2d5e70b825dd87",
      "message": "Prepare next version (0.9.2-SNAPSHOT) (#156)",
      "files": []
    },
    {
      "sha": "dfd7b6ddc8995bb25bc77382b32a99a54ef89a6d",
      "message": "Merge pull request #155 from jadekler/bump_release_0.9.1\n\nbump release from 0.9.1-SNAPSHOT to 0.9.1",
      "files": []
    },
    {
      "sha": "c7f0153168d56fd8bdf081eda225c975efb4db68",
      "message": "Merge branch 'master' into bump_release_0.9.1",
      "files": []
    },
    {
      "sha": "d0e42454cd674cedffbe7a9c0f6d837e9b233098",
      "message": "bump release from 0.9.1-SNAPSHOT to 0.9.1\n\nAlso, fix a documentation problem in RELEASE.md (apparently, searching sonatype\nnow not only accepts periods but requires them).",
      "files": []
    },
    {
      "sha": "8b965c21a8f68e32a8661c17bfaddf681108dd5c",
      "message": "Merge pull request #154 from jadekler/patch-1\n\nUpdate RELEASE.md",
      "files": []
    },
    {
      "sha": "c59f51dcf1eaf8a4a1bbc5ea06025d93fcb792f6",
      "message": "Update RELEASE.md\n\nRelevant issue: https://github.com/resin-io/etcher/issues/1786",
      "files": []
    },
    {
      "sha": "664754ee1208fe17472e41d10aa752851f610e7e",
      "message": "Add caching for JWT tokens (#151)\n\n* Add caching for JWT tokens\r\n\r\n* code style\r\n\r\n* Add tests\r\n\r\n* refresh token 5 minutes early",
      "files": []
    }
  ]
}
